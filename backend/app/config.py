from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ---------------------------------------------------------------------------
    # 1. API Keys & External Services
    # ---------------------------------------------------------------------------
    GROQ_API_KEY: str = ""
    DEEPGRAM_API_KEY: str = ""
    HUME_API_KEY: Optional[str] = None

    # ---------------------------------------------------------------------------
    # 2. LLM Model Configurations (Groq)
    # ---------------------------------------------------------------------------
    GROQ_FAST_MODEL: str = "llama-3.1-8b-instant"
    GROQ_REASONING_MODEL: str = "llama-3.3-70b-versatile"

    # ---------------------------------------------------------------------------
    # 3. Application Data Paths
    # ---------------------------------------------------------------------------
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    DATA_DIR: Path = BASE_DIR / "data"

    CURRICULUM_PATH: Path = DATA_DIR / "curriculum.json"
    CANDIDATES_PATH: Path = DATA_DIR / "candidates.json"  # only read once, by scripts/seed_candidates.py
    DATABASE_PATH: Path = DATA_DIR / "index.db"           # SQLite — live session state only

    # ---------------------------------------------------------------------------
    # 4. MongoDB — permanent storage (candidates + completed interview reports)
    # ---------------------------------------------------------------------------
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB_NAME: str = "interview_prep"

    # ---------------------------------------------------------------------------
    # 5. Auth — shared-password login + JWT
    # ---------------------------------------------------------------------------
    ADMIN_PASSWORD: str = "admin@123"
    CANDIDATE_PASSWORD: str = "cand@123"
    JWT_SECRET_KEY: str = "CHANGE-ME-IN-.env"
    JWT_EXPIRE_MINUTES: int = 720  # 12 hours

    # ---------------------------------------------------------------------------
    # 6. Interview Constraints & Rules
    # ---------------------------------------------------------------------------
    MIN_QUESTIONS: int = 8
    MIN_CURRICULUM_DAYS: int = 4

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
