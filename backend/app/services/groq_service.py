import json
from typing import Dict, List
from groq import Groq
from app.config import settings
from app.schemas import FeedbackSchema


class GroqService:
    """Handles interactions with Groq API models for chat and report generation."""

    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY) if settings.GROQ_API_KEY else None

    def _get_client(self) -> Groq:
        if not self.client:
            if settings.GROQ_API_KEY:
                self.client = Groq(api_key=settings.GROQ_API_KEY)
            else:
                raise ValueError("GROQ_API_KEY is missing from configuration.")
        return self.client

    def generate_opening_question(
        self,
        messages: List[Dict[str, str]],
        model: str = settings.GROQ_FAST_MODEL
    ) -> str:
        """Generates the first interview question. No previous answer to evaluate yet."""
        client = self._get_client()
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.6,
            max_tokens=120,
        )
        return response.choices[0].message.content.strip()

    def generate_turn_response(
        self,
        messages: List[Dict[str, str]],
        model: str = settings.GROQ_FAST_MODEL
    ) -> Dict[str, str]:
        """
        Generates the next interviewer turn as structured JSON:
        {"feedback": "...", "question": "..."}
        so the frontend can show evaluation of the previous answer separately
        from the next question, instead of one mixed text blob.
        """
        client = self._get_client()
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.6,
            max_tokens=220,
            response_format={"type": "json_object"},
        )
        content = response.choices[0].message.content
        return json.loads(content)

    def generate_final_report(
        self,
        history: List[Dict[str, str]],
        assessed_days: List[int]
    ) -> FeedbackSchema:
        """Generates the structured diagnostic evaluation report upon interview completion."""
        client = self._get_client()

        eval_system_prompt = (
            "You are a Senior Technical Evaluation Engine.\n"
            f"Assessed Curriculum Days: {assessed_days}\n\n"
            "TASK:\n"
            "Analyze the entire technical interview conversation transcript and produce a strict JSON output matching the following schema:\n"
            "{\n"
            '  "summary": "High-level summary of the candidate\'s overall performance and conceptual grasp.",\n'
            '  "strengths": ["Array of specific technical strengths demonstrated during the interview."],\n'
            '  "gaps": ["Array of technical knowledge gaps, misunderstandings, or incomplete answers identified."],\n'
            '  "next": ["Array of specific, actionable learning recommendations and topics to review."]\n'
            "}\n\n"
            "RULES:\n"
            "- Return ONLY valid JSON.\n"
            "- Ensure arrays contain concise, actionable technical bullet points."
        )

        eval_messages = [{"role": "system", "content": eval_system_prompt}]
        for msg in history:
            if msg.get("role") in ["user", "assistant"]:
                eval_messages.append(msg)

        response = client.chat.completions.create(
            model=settings.GROQ_REASONING_MODEL,
            messages=eval_messages,
            temperature=0.2,
            response_format={"type": "json_object"}
        )

        content = response.choices[0].message.content
        parsed_json = json.loads(content)
        return FeedbackSchema(**parsed_json)


# Global singleton instance for app-wide import
groq_service = GroqService()
