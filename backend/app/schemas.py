from typing import List, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# 1. Candidate Profile Schemas (mirrors candidates.json)
# ---------------------------------------------------------------------------

class MissionSchema(BaseModel):
    day: int
    title: str
    passed: Optional[bool] = None
    skipped: Optional[bool] = False
    attempts: Optional[int] = 0


class MemberSchema(BaseModel):
    id: str
    name: str
    jobRole: str
    yearsExperience: int
    education: str
    status: str


class SignalsSchema(BaseModel):
    commitDays: int
    missionsCompleted: int
    missionsFirstTry: int


class CandidateSchema(BaseModel):
    member: MemberSchema
    missions: List[MissionSchema]
    signals: SignalsSchema


# ---------------------------------------------------------------------------
# 2. Audio & Acoustic Metrics Schemas (for Deepgram / Hume AI integrations)
# ---------------------------------------------------------------------------

class AcousticMetricsSchema(BaseModel):
    turn: int
    speech_rate_wpm: float = Field(default=0.0, description="Words per minute")
    filler_word_count: int = Field(default=0, description="Count of 'um', 'uh', etc.")
    long_pause_count: int = Field(default=0, description="Pauses over threshold (e.g. >1.5s)")
    total_pause_duration_sec: float = Field(default=0.0, description="Cumulative silence duration")


# ---------------------------------------------------------------------------
# 3. HTTP Endpoint Request Schemas (POST /api/interview)
# ---------------------------------------------------------------------------

class InterviewStartRequest(BaseModel):
    sessionId: str
    candidate: CandidateSchema


class InterviewTurnRequest(BaseModel):
    sessionId: str
    message: str


# ---------------------------------------------------------------------------
# 4. Final Feedback & Response Schemas (conforms to tech_spec.md)
# ---------------------------------------------------------------------------

class FeedbackSchema(BaseModel):
    summary: str = Field(..., description="Overall diagnostic evaluation summary")
    strengths: List[str] = Field(..., description="Concise array of technical strengths")
    gaps: List[str] = Field(..., description="Concise array of identified knowledge gaps")
    next: List[str] = Field(..., description="Actionable next steps for learning focus")


class InterviewResponseSchema(BaseModel):
    reply: str = Field(..., description="Interviewer response or feedback summary")
    done: bool = Field(..., description="True if interview is completed, False otherwise")
    feedback: Optional[FeedbackSchema] = Field(
        default=None, 
        description="Populated only when done=True"
    )