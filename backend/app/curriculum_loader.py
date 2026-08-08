import json
from pathlib import Path
from typing import Dict, List, Optional, Any
from app.config import settings


class CurriculumLoader:
    """Loads, caches, and queries curriculum data from curriculum.json."""

    def __init__(self, file_path: Optional[Path] = None):
        self.file_path = file_path or settings.CURRICULUM_PATH
        self._curriculum_data: Dict[str, Any] = {}
        self._days_map: Dict[int, Dict[str, Any]] = {}
        self._modules_map: Dict[int, Dict[str, Any]] = {}
        self.load_curriculum()

    def load_curriculum(self) -> None:
        """Loads curriculum JSON into memory and builds fast lookup maps."""
        if not self.file_path.exists():
            raise FileNotFoundError(f"Curriculum file not found at {self.file_path}")

        with open(self.file_path, "r", encoding="utf-8") as f:
            self._curriculum_data = json.load(f)

        # Build fast lookup map for days
        for day_info in self._curriculum_data.get("days", []):
            day_num = day_info.get("day")
            if day_num is not None:
                self._days_map[day_num] = day_info

        # Build fast lookup map for modules
        for mod_info in self._curriculum_data.get("modules", []):
            mod_num = mod_info.get("n")
            if mod_num is not None:
                self._modules_map[mod_num] = mod_info

    def get_day_info(self, day: int) -> Optional[Dict[str, Any]]:
        """Retrieves complete metadata for a specific curriculum day."""
        return self._days_map.get(day)

    def get_day_objectives(self, day: int) -> List[str]:
        """Retrieves learning objectives for a specific day."""
        day_info = self.get_day_info(day)
        return day_info.get("objectives", []) if day_info else []

    def get_day_tools(self, day: int) -> List[str]:
        """Retrieves tools and technologies used on a specific day."""
        day_info = self.get_day_info(day)
        return day_info.get("tools", []) if day_info else []

    def get_all_days(self) -> List[int]:
        """Returns a list of all available curriculum days."""
        return sorted(list(self._days_map.keys()))

    def get_module_by_day(self, day: int) -> Optional[Dict[str, Any]]:
        """Finds which module a given day belongs to."""
        for mod_info in self._modules_map.values():
            day_range = mod_info.get("days", [])
            if len(day_range) == 2 and day_range[0] <= day <= day_range[1]:
                return mod_info
        return None

    def format_day_context_for_prompt(self, day: int) -> str:
        """Formats day metadata into a clean text block for LLM prompt context."""
        day_info = self.get_day_info(day)
        if not day_info:
            return ""

        title = day_info.get("title", "")
        objectives = "\n  - ".join(day_info.get("objectives", []))
        tools = ", ".join(day_info.get("tools", []))

        return (
            f"Day {day}: {title}\n"
            f"Tools: {tools}\n"
            f"Learning Objectives:\n  - {objectives}"
        )


# Global singleton instance for app-wide import
curriculum_loader = CurriculumLoader()