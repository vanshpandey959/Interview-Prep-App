import json
from typing import Dict, Any, List, Tuple, Optional
from app.config import settings
from app.curriculum_loader import curriculum_loader
from app.candidate_analyzer import candidate_analyzer
from app.services.database_service import database_service
from app.services.groq_service import groq_service
from app.schemas import FeedbackSchema, InterviewResponseSchema


class OrchestrationService:
    """Orchestrates interview state, question rules, and session lifecycle."""

    def initialize_session(self, session_id: str, candidate_data: Dict[str, Any]) -> InterviewResponseSchema:
        """Initializes a new interview session and returns the opening question."""
        # 1. Analyze candidate and pick target curriculum days (minimum 4 days)
        target_days = candidate_analyzer.select_target_curriculum_days(
            candidate_data, 
            count=settings.MIN_CURRICULUM_DAYS
        )
        initial_day = target_days[0] if target_days else 1

        # 2. Build system context prompt for opening turn
        candidate_summary = candidate_analyzer.generate_candidate_summary_prompt(candidate_data)
        day_context = curriculum_loader.format_day_context_for_prompt(initial_day)

        system_prompt = (
            "You are an expert technical interviewer conducting a live assessment.\n"
            f"{candidate_summary}\n\n"
            f"CURRENT ASSESSED DAY:\n{day_context}\n\n"
            "INSTRUCTIONS:\n"
            "- Start the interview with a concise, welcoming, and direct technical question regarding the current day's topic.\n"
            "- Ask ONE clear question at a time.\n"
            "- Do NOT mention internal metrics, attempt scores, or day numbers directly to the candidate."
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Hello, I am ready to start the technical interview."}
        ]

        # 3. Generate initial question via Groq LLM
        opening_reply = groq_service.generate_chat_response(messages, model=settings.GROQ_FAST_MODEL)

        # 4. Save initial session state to SQLite database
        candidate_id = candidate_data.get("member", {}).get("id", "UNKNOWN")
        database_service.create_session(
            session_id=session_id,
            candidate_id=candidate_id,
            initial_history=messages + [{"role": "assistant", "content": opening_reply}],
            assessed_days=[initial_day]
        )

        return InterviewResponseSchema(reply=opening_reply, done=False, feedback=None)

    def process_turn(self, session_id: str, candidate_message: str) -> InterviewResponseSchema:
        """Processes an incoming candidate turn, updates history, and determines next question/evaluation."""
        # 1. Retrieve current session state from SQLite
        session = database_service.get_session(session_id)
        if not session:
            raise ValueError(f"Session '{session_id}' not found.")

        if session["is_completed"]:
            # If session is already completed, return existing feedback report
            stored_report = json.loads(session["feedback_report"]) if session["feedback_report"] else {}
            feedback_obj = FeedbackSchema(**stored_report) if stored_report else None
            return InterviewResponseSchema(
                reply="Interview already completed.", 
                done=True, 
                feedback=feedback_obj
            )

        history: List[Dict[str, str]] = json.loads(session["conversation_history"])
        assessed_days: List[int] = json.loads(session["assessed_days"])
        current_turn: int = session["current_turn"] + 1

        # Append candidate's turn
        history.append({"role": "user", "content": candidate_message})

        # 2. Check if interview termination criteria are fulfilled
        # Rule: Minimum 8 questions asked AND minimum 4 unique curriculum days covered
        has_min_questions = current_turn >= settings.MIN_QUESTIONS
        has_min_days = len(assessed_days) >= settings.MIN_CURRICULUM_DAYS

        if has_min_questions and has_min_days:
            return self._finalize_interview(session_id, history, assessed_days, current_turn)

        # 3. Select next topic day if topic transition is needed
        current_day = assessed_days[-1] if assessed_days else 1
        
        # Switch topic every 2 questions if criteria require more day coverage
        if current_turn % 2 == 0 and len(assessed_days) < settings.MIN_CURRICULUM_DAYS:
            all_days = curriculum_loader.get_all_days()
            next_days = [d for d in all_days if d not in assessed_days]
            if next_days:
                current_day = next_days[0]
                assessed_days.append(current_day)

        # 4. Construct updated dynamic system prompt for Groq
        day_context = curriculum_loader.format_day_context_for_prompt(current_day)
        turn_prompt = (
            f"You are conducting turn {current_turn + 1} of a technical interview.\n"
            f"Total Days Covered So Far: {assessed_days}\n"
            f"CURRENT TOPIC CONTEXT:\n{day_context}\n\n"
            "INSTRUCTIONS:\n"
            "- Evaluate candidate's previous response.\n"
            "- If response was brief or incomplete, ask a targeted follow-up question on the current topic.\n"
            "- If response was complete, transition cleanly to a new question on the current topic.\n"
            "- Keep questions professional, concise, and focused on core engineering logic.\n"
            "- Ask ONLY ONE question at a time."
        )

        # Replace or update lead system prompt
        history[0] = {"role": "system", "content": turn_prompt}

        # 5. Call Groq API for next conversational reply
        next_reply = groq_service.generate_chat_response(history, model=settings.GROQ_FAST_MODEL)
        history.append({"role": "assistant", "content": next_reply})

        # 6. Update database state
        database_service.update_session_history(
            session_id=session_id,
            history=history,
            current_turn=current_turn,
            assessed_days=assessed_days
        )

        return InterviewResponseSchema(reply=next_reply, done=False, feedback=None)

    def _finalize_interview(
        self, 
        session_id: str, 
        history: List[Dict[str, str]], 
        assessed_days: List[int],
        current_turn: int
    ) -> InterviewResponseSchema:
        """Concludes the interview session and generates a structured evaluation report."""
        # Call Groq reasoning model to format final diagnostic JSON feedback report
        feedback_report = groq_service.generate_final_report(history, assessed_days)

        closing_reply = (
            "Thank you for completing the technical interview! "
            "Your response submission has been evaluated and logged successfully."
        )

        # Persist completion and structured feedback into SQLite
        database_service.mark_session_complete(
            session_id=session_id,
            history=history,
            current_turn=current_turn,
            assessed_days=assessed_days,
            feedback_report=feedback_report.model_dump()
        )

        return InterviewResponseSchema(
            reply=closing_reply,
            done=True,
            feedback=feedback_report
        )


# Global singleton instance for app-wide import
orchestration_service = OrchestrationService()