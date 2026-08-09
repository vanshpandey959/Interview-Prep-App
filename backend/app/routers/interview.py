from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from app.schemas import InterviewStartRequest, InterviewTurnRequest, InterviewResponseSchema
from app.services.orchestration_service import orchestration_service
from app.services.stt_service import stt_service
from app.services.database_service import database_service
from app.dependencies import require_candidate

router = APIRouter(prefix="/api/interview", tags=["interview"])


def _verify_session_owner(session_id: str, candidate_id: str) -> None:
    """Ensures a candidate can only continue their own session."""
    session = database_service.get_session(session_id)
    if session and session["candidate_id"] != candidate_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This session belongs to a different candidate.")


@router.post("/start", response_model=InterviewResponseSchema)
def start_interview(payload: InterviewStartRequest, user: dict = Depends(require_candidate)):
    try:
        return orchestration_service.initialize_session(
            session_id=payload.sessionId,
            candidate_id=user["id"],
        )
    except ValueError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e))
    except Exception as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Internal Server Error: {str(e)}")


@router.post("/turn", response_model=InterviewResponseSchema)
def send_turn(payload: InterviewTurnRequest, user: dict = Depends(require_candidate)):
    _verify_session_owner(payload.sessionId, user["id"])
    try:
        return orchestration_service.process_turn(
            session_id=payload.sessionId,
            candidate_message=payload.message,
        )
    except ValueError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e))
    except Exception as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Internal Server Error: {str(e)}")


@router.post("/audio", response_model=InterviewResponseSchema)
async def send_audio_turn(
    sessionId: str = Form(...),
    audio_file: UploadFile = File(...),
    user: dict = Depends(require_candidate),
):
    _verify_session_owner(sessionId, user["id"])
    try:
        audio_bytes = await audio_file.read()
        mimetype = audio_file.content_type or "audio/wav"

        stt_result = await stt_service.transcribe_with_speech_metrics(
            audio_bytes=audio_bytes, mimetype=mimetype
        )
        transcript = stt_result.get("transcript")
        metrics = stt_result.get("metrics")

        if not transcript:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Could not transcribe audio. Speech was unintelligible or empty."
            )

        if metrics:
            database_service.log_acoustic_metric(session_id=sessionId, metric_data=metrics)

        return orchestration_service.process_turn(
            session_id=sessionId,
            candidate_message=transcript
        )
    except ValueError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Audio Turn Processing Error: {str(e)}")
