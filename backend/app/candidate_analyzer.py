import json
from pathlib import Path
from typing import Dict, List, Optional, Any
from app.config import settings
from app.schemas import CandidateSchema
from app.curriculum_loader import curriculum_loader


class CandidateAnalyzer:
    """Analyzes candidate learning history to select interview focus topics."""

    def __init__(self, file_path: Optional[Path] = None):
        self.file_path = file_path or settings.CANDIDATES_PATH
        self._candidates_data: Dict[str, Any] = {}
        self.load_candidates()

    def load_candidates(self) -> None:
        """Loads candidate profiles from JSON into memory."""
        if not self.file_path.exists():
            return

        with open(self.file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            # Index candidates by member ID for O(1) lookup
            for cand in data.get("candidates", []):
                member_id = cand.get("member", {}).get("id")
                if member_id:
                    self._candidates_data[member_id] = cand

    def get_candidate_by_id(self, candidate_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves candidate profile dictionary by member ID."""
        return self._candidates_data.get(candidate_id)

    def analyze_candidate(self, candidate_data: Dict[str, Any]) -> Dict[str, Any]:
        """Categorizes candidate missions into priority evaluation buckets."""
        missions = candidate_data.get("missions", [])
        
        passed_first_try: List[int] = []
        high_attempts: List[int] = []  # >= 3 attempts (indicates potential struggle)
        failed_topics: List[int] = []  # passed: False
        skipped_topics: List[int] = [] # skipped: True

        for m in missions:
            day = m.get("day")
            if not day:
                continue

            attempts = m.get("attempts", 0)
            passed = m.get("passed", False)
            skipped = m.get("skipped", False)

            if skipped:
                skipped_topics.append(day)
            elif not passed and attempts > 0:
                failed_topics.append(day)
            elif passed and attempts >= 3:
                high_attempts.append(day)
            elif passed and attempts == 1:
                passed_first_try.append(day)

        return {
            "high_attempts": high_attempts,
            "failed_topics": failed_topics,
            "skipped_topics": skipped_topics,
            "passed_first_try": passed_first_try,
            "total_missions": len(missions)
        }

    def select_target_curriculum_days(self, candidate_data: Dict[str, Any], count: int = 4) -> List[int]:
        """
        Selects target curriculum days covering at least `count` distinct days.
        Prioritizes:
        1. Failed or High-Attempt topics (to evaluate conceptual depth/mastery)
        2. Skipped topics (to test knowledge boundaries)
        3. Passed-first-try core topics (to assess strong foundations)
        """
        analysis = self.analyze_candidate(candidate_data)
        target_days: List[int] = []

        # Priority 1: Failed or High Attempt Days
        for day in analysis["failed_topics"] + analysis["high_attempts"]:
            if day not in target_days and curriculum_loader.get_day_info(day):
                target_days.append(day)
                if len(target_days) >= count:
                    break

        # Priority 2: Skipped Days
        if len(target_days) < count:
            for day in analysis["skipped_topics"]:
                if day not in target_days and curriculum_loader.get_day_info(day):
                    target_days.append(day)
                    if len(target_days) >= count:
                        break

        # Priority 3: Passed First Try / Other Completed Days
        if len(target_days) < count:
            for day in analysis["passed_first_try"]:
                if day not in target_days and curriculum_loader.get_day_info(day):
                    target_days.append(day)
                    if len(target_days) >= count:
                        break

        # Fallback: Default curriculum sampling if candidate profile data is sparse
        if len(target_days) < count:
            for day in curriculum_loader.get_all_days():
                if day not in target_days:
                    target_days.append(day)
                    if len(target_days) >= count:
                        break

        return sorted(target_days)

    def generate_candidate_summary_prompt(self, candidate_data: Dict[str, Any]) -> str:
        """Formats candidate background and telemetry into a concise text block for LLM prompts."""
        member = candidate_data.get("member", {})
        analysis = self.analyze_candidate(candidate_data)
        
        name = member.get("name", "Candidate")
        role = member.get("jobRole", "Software Engineer")
        exp = member.get("yearsExperience", 0)
        
        return (
            f"Candidate: {name} ({role}, {exp} years experience)\n"
            f"High-Attempt/Struggled Days: {analysis['high_attempts'] + analysis['failed_topics']}\n"
            f"Skipped Days: {analysis['skipped_topics']}\n"
            f"Target Days Selected for Interview: {self.select_target_curriculum_days(candidate_data, settings.MIN_CURRICULUM_DAYS)}"
        )


# Global singleton instance for app-wide import
candidate_analyzer = CandidateAnalyzer()