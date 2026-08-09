import json
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, status
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.schemas import (
    InterviewStartRequest,
    InterviewTurnRequest,
    InterviewResponseSchema
)
from app.services.orchestration_service import orchestration_service
from app.services.stt_service import stt_service
from app.services.database_service import database_service

app = FastAPI(
    title="AI Technical Interviewer API",
    description="Stateless API conducting dynamic technical interviews based on curriculum and candidate profile data.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    # allow_origins=["*"] combined with allow_credentials=True is invalid per the
    # CORS spec and browsers will reject it. This app doesn't use cookies/auth
    # headers, so list explicit dev origins and drop allow_credentials.
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],  # Adjust/add production origin(s) on deploy
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# File path to candidates JSON source — reuse the same setting the rest of the
# backend (candidate_analyzer.py) already uses, so both code paths read the
# same file regardless of the process's working directory.
CANDIDATES_FILE_PATH = settings.CANDIDATES_PATH


def load_candidates_from_file():
    """Helper utility to read and parse the candidate list from JSON.

    candidates.json is shaped as {"candidates": [...]}; this returns just
    the list, matching what candidate_analyzer.py expects when it iterates
    data.get("candidates", []).
    """
    if not CANDIDATES_FILE_PATH.exists():
        return []
    try:
        with open(CANDIDATES_FILE_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("candidates", []) if isinstance(data, dict) else data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load candidates file: {str(e)}"
        )


@app.get("/")
def health_check():
    """Health check endpoint to verify backend status."""
    return {"status": "online", "service": "AI Technical Interviewer API"}


@app.get("/api/candidates")
def get_candidates():
    candidates = load_candidates_from_file()
    print(f"DEBUG: Found {len(candidates)} candidates in file.")
    return {"candidates": candidates}


@app.get("/api/candidates/{candidate_id}")
def get_candidate_by_id(candidate_id: str):
    """Fetches a single candidate profile by ID."""
    candidates = load_candidates_from_file()
    
    # Check matching ID in root or nested member struct
    for cand in candidates:
        cand_id = cand.get("id") or cand.get("member", {}).get("id")
        if cand_id == candidate_id:
            return cand
            
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Candidate with ID '{candidate_id}' not found."
    )


@app.post("/api/interview", response_model=InterviewResponseSchema)
def handle_interview_turn(payload: dict):
    """
    Single unified endpoint handling both JSON interview initialization and text turns.
    Determines route based on presence of 'candidate' vs 'message' in request body.
    """
    try:
        session_id = payload.get("sessionId")
        if not session_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing required field: 'sessionId'"
            )

        # Route 1: Initialize New Interview Session
        if "candidate" in payload:
            start_req = InterviewStartRequest(**payload)
            candidate_dict = start_req.candidate.model_dump()
            return orchestration_service.initialize_session(
                session_id=start_req.sessionId,
                candidate_data=candidate_dict
            )

        # Route 2: Process Ongoing Text Turn
        elif "message" in payload:
            turn_req = InterviewTurnRequest(**payload)
            return orchestration_service.process_turn(
                session_id=turn_req.sessionId,
                candidate_message=turn_req.message
            )

        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payload must include either 'candidate' (to start) or 'message' (for turn)."
            )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal Server Error: {str(e)}"
        )


@app.post("/api/interview/audio", response_model=InterviewResponseSchema)
async def handle_audio_interview_turn(
    sessionId: str = Form(...),
    audio_file: UploadFile = File(...)
):
    """
    Multipart endpoint accepting audio recordings (WAV, MP3, WebM, FLAC).
    Transcribes audio via Deepgram STT, extracts acoustic delivery metrics,
    logs acoustic features to SQLite, and passes the transcript to orchestration.
    """
    try:
        if not audio_file:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No audio file uploaded."
            )

        # 1. Read binary audio stream from upload
        audio_bytes = await audio_file.read()
        mimetype = audio_file.content_type or "audio/wav"

        # 2. Transcribe audio & extract acoustic speech metrics using Deepgram STT
        stt_result = await stt_service.transcribe_with_speech_metrics(
            audio_bytes=audio_bytes,
            mimetype=mimetype
        )

        transcript = stt_result.get("transcript")
        metrics = stt_result.get("metrics")

        if not transcript:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not transcribe audio. Speech was unintelligible or empty."
            )

        # 3. Log acoustic metrics to SQLite for session tracking
        if metrics:
            database_service.log_acoustic_metric(
                session_id=sessionId,
                metric_data=metrics
            )

        # 4. Process transcribed message through orchestration engine
        return orchestration_service.process_turn(
            session_id=sessionId,
            candidate_message=transcript
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Audio Turn Processing Error: {str(e)}"
        )