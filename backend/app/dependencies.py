from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.security import decode_access_token

_security_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_security_scheme),
) -> dict:
    """Decodes the Bearer token. Any protected route depends on this (directly or indirectly)."""
    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token.")
    return {"id": payload["sub"], "role": payload["role"]}


def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user["role"] != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin access required.")
    return user


def require_candidate(user: dict = Depends(get_current_user)) -> dict:
    if user["role"] != "candidate":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Candidate access required.")
    return user


def require_self_or_admin(candidate_id: str, user: dict = Depends(get_current_user)) -> dict:
    """For candidate-scoped resources: the matching candidate OR any admin may access."""
    if user["role"] == "admin":
        return user
    if user["role"] == "candidate" and user["id"] == candidate_id:
        return user
    raise HTTPException(status.HTTP_403_FORBIDDEN, "Not authorized for this candidate's data.")
