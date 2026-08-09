from fastapi import APIRouter, HTTPException, status
from app.services.mongo_service import mongo_service

router = APIRouter(prefix="/api/candidates", tags=["candidates"])

# NOTE: intentionally public/unauthenticated — this is just the profile
# picker shown before a candidate logs in (same behavior as before auth
# existed). If candidate profiles contain anything sensitive later, add
# require_candidate/require_admin here and adjust the frontend picker flow.


@router.get("")
def list_candidates():
    return {"candidates": mongo_service.list_candidates()}


@router.get("/{candidate_id}")
def get_candidate(candidate_id: str):
    candidate = mongo_service.get_candidate_by_id(candidate_id)
    if not candidate:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Candidate '{candidate_id}' not found.")
    return candidate
