import json
from typing import Optional
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, status
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


@app.get("/")
def health_check():
    """Health check endpoint to verify backend status."""
    return {"status": "online", "service": "AI Technical Interviewer API"}


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