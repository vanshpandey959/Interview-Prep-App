from fastapi import APIRouter, Depends
from app.services.mongo_service import mongo_service
from app.dependencies import require_self_or_admin

router = APIRouter(prefix="/api/candidates", tags=["reports"])


@router.get("/{candidate_id}/reports")
def get_candidate_reports(candidate_id: str, user: dict = Depends(require_self_or_admin)):
    """A candidate viewing their own past interview reports (or an admin viewing any candidate's)."""
    return {"reports": mongo_service.get_reports_for_candidate(candidate_id)}
