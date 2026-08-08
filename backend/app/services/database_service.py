import sqlite3
import json
from pathlib import Path
from typing import Dict, Any, Optional, List
from app.config import settings


class DatabaseService:
    """Manages SQLite database connections, table creation, and session persistence."""

    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = db_path or settings.DATABASE_PATH
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        """Helper to create a connection with dictionary-like row factory."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        """Ensures the parent directory exists and creates the session table if not present."""
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS interview_sessions (
                    session_id TEXT PRIMARY KEY,
                    candidate_id TEXT NOT NULL,
                    current_turn INTEGER DEFAULT 0,
                    assessed_days TEXT DEFAULT '[]',
                    conversation_history TEXT DEFAULT '[]',
                    acoustic_metrics TEXT DEFAULT '[]',
                    is_completed BOOLEAN DEFAULT FALSE,
                    feedback_report TEXT DEFAULT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            conn.commit()

    def create_session(
        self, 
        session_id: str, 
        candidate_id: str, 
        initial_history: List[Dict[str, str]], 
        assessed_days: List[int]
    ) -> None:
        """Creates a new session record in the database."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO interview_sessions 
                (session_id, candidate_id, current_turn, assessed_days, conversation_history, is_completed)
                VALUES (?, ?, ?, ?, ?, FALSE);
                """,
                (
                    session_id,
                    candidate_id,
                    1,
                    json.dumps(assessed_days),
                    json.dumps(initial_history)
                )
            )
            conn.commit()

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves session record by session_id."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM interview_sessions WHERE session_id = ?;", 
                (session_id,)
            )
            row = cursor.fetchone()
            if row:
                return dict(row)
            return None

    def update_session_history(
        self, 
        session_id: str, 
        history: List[Dict[str, str]], 
        current_turn: int, 
        assessed_days: List[int]
    ) -> None:
        """Updates the conversation history, turn count, and covered days for an ongoing session."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                UPDATE interview_sessions
                SET conversation_history = ?,
                    current_turn = ?,
                    assessed_days = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE session_id = ?;
                """,
                (
                    json.dumps(history),
                    current_turn,
                    json.dumps(assessed_days),
                    session_id
                )
            )
            conn.commit()

    def log_acoustic_metric(self, session_id: str, metric_data: Dict[str, Any]) -> None:
        """Appends audio/acoustic features (speech rate, pause counts) to the session record."""
        session = self.get_session(session_id)
        if not session:
            return

        existing_metrics: List[Dict[str, Any]] = json.loads(session.get("acoustic_metrics") or "[]")
        existing_metrics.append(metric_data)

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                UPDATE interview_sessions
                SET acoustic_metrics = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE session_id = ?;
                """,
                (json.dumps(existing_metrics), session_id)
            )
            conn.commit()

    def mark_session_complete(
        self, 
        session_id: str, 
        history: List[Dict[str, str]], 
        current_turn: int, 
        assessed_days: List[int],
        feedback_report: Dict[str, Any]
    ) -> None:
        """Marks the interview as completed and stores the final structured feedback report."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                UPDATE interview_sessions
                SET conversation_history = ?,
                    current_turn = ?,
                    assessed_days = ?,
                    is_completed = TRUE,
                    feedback_report = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE session_id = ?;
                """,
                (
                    json.dumps(history),
                    current_turn,
                    json.dumps(assessed_days),
                    json.dumps(feedback_report),
                    session_id
                )
            )
            conn.commit()


# Global singleton instance for app-wide import
database_service = DatabaseService()