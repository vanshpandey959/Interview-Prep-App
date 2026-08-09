from typing import List, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# 1. Candidate Profile Schemas (mirrors the Mongo `candidates` collection)
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
# 2. Auth Schemas
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    password: str
    candidateId: Optional[str] = Field(
        default=None, description="Required for candidate login; omit for admin login."
    )


class TokenResponse(BaseModel):
    accessToken: str
    role: str
    candidateId: Optional[str] = None


# ---------------------------------------------------------------------------
# 3. HTTP Endpoint Request Schemas
# ---------------------------------------------------------------------------

class InterviewStartRequest(BaseModel):
    sessionId: str
    # candidateId is intentionally NOT here — it comes from the auth token,
    # so a candidate can only ever start an interview as themselves.


class InterviewTurnRequest(BaseModel):
    sessionId: str
    message: str


# ---------------------------------------------------------------------------
# 4. Delivery/Structure Metrics (chart-ready, computed — not LLM-generated)
# ---------------------------------------------------------------------------
# fluencyScore/deliveryScore are heuristic composites of pace, filler rate,
# and pause frequency — they describe speech DELIVERY, not the candidate's
# actual confidence or psychological state. Label them accordingly in the UI.
class InterviewMetricsSchema(BaseModel):
    hasVoiceData: bool = Field(..., description="False if candidate answered entirely via text")
    audioTurnsCount: int = Field(default=0)

    avgWordsPerMinute: float = Field(default=0.0)
    paceLabel: str = Field(default="N/A", description="'Slow' | 'Ideal' | 'Fast' | 'N/A'")

    totalFillerWords: int = Field(default=0)
    fillerWordsPerMinute: float = Field(default=0.0)

    totalPauseCount: int = Field(default=0)
    totalPauseDurationSeconds: float = Field(default=0.0)
    longestPauseSeconds: float = Field(default=0.0)

    fluencyScore: int = Field(default=0)
    deliveryScore: int = Field(default=0)

    totalQuestionsAsked: int = Field(default=0)
    followUpQuestions: int = Field(default=0)
    newTopicQuestions: int = Field(default=0)

    curriculumDaysCovered: int = Field(default=0)
    targetCurriculumDays: int = Field(default=0)

    totalSpeakingDurationSeconds: float = Field(default=0.0)


# ---------------------------------------------------------------------------
# 5. Final Feedback & Response Schemas
# ---------------------------------------------------------------------------

class FeedbackSchema(BaseModel):
    summary: str
    strengths: List[str]
    gaps: List[str]
    next: List[str]
    metrics: Optional[InterviewMetricsSchema] = None


class InterviewResponseSchema(BaseModel):
    reply: str = Field(..., description="The interviewer's next question (or closing message when done)")
    previousAnswerFeedback: Optional[str] = Field(
        default=None,
        description="Brief evaluation of the candidate's previous answer, shown separately from 'reply' in the UI"
    )
    isFollowUp: Optional[bool] = Field(
        default=None,
        description="True if 'reply' follows up on the same topic; False if it opens a new curriculum day; None on the opening question"
    )
    done: bool = Field(..., description="True if the interview is complete")
    feedback: Optional[FeedbackSchema] = Field(default=None, description="Populated only when done=True")


# ---------------------------------------------------------------------------
# 6. Report response (candidate/admin history views — mirrors a Mongo report doc)
# ---------------------------------------------------------------------------

class InterviewReportSchema(BaseModel):
    sessionId: str
    candidateId: str
    assessedDays: List[int]
    feedback: FeedbackSchema
    completedAt: Optional[str] = None
