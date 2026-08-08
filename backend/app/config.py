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
    # Fast model for standard conversation turns & quick follow-ups
    GROQ_FAST_MODEL: str = "llama-3.1-8b-instant"
    # High-reasoning model for evaluation report generation
    GROQ_REASONING_MODEL: str = "llama-3.3-70b-versatile"

    # ---------------------------------------------------------------------------
    # 3. Application Data Paths
    # ---------------------------------------------------------------------------
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    
    CURRICULUM_PATH: Path = DATA_DIR / "curriculum.json"
    CANDIDATES_PATH: Path = DATA_DIR / "candidates.json"
    DATABASE_PATH: Path = DATA_DIR / "index.db"

    # ---------------------------------------------------------------------------
    # 4. Interview Constraints & Rules (tech_spec.md)
    # ---------------------------------------------------------------------------
    MIN_QUESTIONS: int = 8
    MIN_CURRICULUM_DAYS: int = 4

    # ---------------------------------------------------------------------------
    # 5. Pydantic Settings Config
    # ---------------------------------------------------------------------------
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


# Instantiate a global settings object for import across the app
settings = Settings()