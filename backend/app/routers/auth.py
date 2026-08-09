from fastapi import APIRouter, HTTPException, status
from app.schemas import LoginRequest, TokenResponse
from app.security import authenticate, create_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    """
    Same-password login. Admin: {"password": "admin@123"}.
    Candidate: {"password": "cand@123", "candidateId": "<id>"}.
    """
    result = authenticate(payload.password, payload.candidateId)
    if not result:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials.")

    token = create_access_token(result["subject"], result["role"])
    return TokenResponse(
        accessToken=token,
        role=result["role"],
        candidateId=result["subject"] if result["role"] == "candidate" else None,
    )
