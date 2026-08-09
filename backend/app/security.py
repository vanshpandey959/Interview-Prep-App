from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
from app.config import settings

ALGORITHM = "HS256"


def create_access_token(subject: str, role: str) -> str:
    """Issues a signed JWT carrying the subject id ('admin' or a candidateId) and role."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload = {"sub": subject, "role": role, "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        return None


def authenticate(password: str, candidate_id: Optional[str] = None) -> Optional[dict]:
    """
    Same-password auth: role is determined purely by which fixed password matches.
    Admin login needs only the admin password. Candidate login needs the shared
    candidate password AND a candidateId (to know who's logging in).
    """
    if password == settings.ADMIN_PASSWORD:
        return {"subject": "admin", "role": "admin"}
    if password == settings.CANDIDATE_PASSWORD and candidate_id:
        return {"subject": candidate_id, "role": "candidate"}
    return None
