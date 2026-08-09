from fastapi import APIRouter, Depends
from app.services.mongo_service import mongo_service
from app.dependencies import require_admin

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/overview")
def get_overview(user: dict = Depends(require_admin)):
    """Group-level stats: total candidates, how many have/haven't interviewed, total interviews completed."""
    return mongo_service.get_admin_overview()


@router.get("/candidates")
def get_candidates_with_status(user: dict = Depends(require_admin)):
    """Full candidate list annotated with whether each has completed at least one interview."""
    candidates = mongo_service.list_candidates()
    interviewed_ids = {r["candidateId"] for r in mongo_service.get_all_reports()}
    for c in candidates:
        c["hasCompletedInterview"] = c.get("member", {}).get("id") in interviewed_ids
    return {"candidates": candidates}


@router.get("/reports")
def get_all_reports(user: dict = Depends(require_admin)):
    """Every completed interview report, most recent first."""
    return {"reports": mongo_service.get_all_reports()}


@router.get("/reports/{candidate_id}")
def get_reports_for_candidate(candidate_id: str, user: dict = Depends(require_admin)):
    return {"reports": mongo_service.get_reports_for_candidate(candidate_id)}
