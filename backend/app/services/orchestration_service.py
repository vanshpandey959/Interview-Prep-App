import json
from typing import Any, Dict, List
from app.config import settings
from app.curriculum_loader import curriculum_loader
from app.candidate_analyzer import candidate_analyzer
from app.services.database_service import database_service
from app.services.groq_service import groq_service
from app.services.metrics_service import metrics_service
from app.services.mongo_service import mongo_service
from app.schemas import InterviewResponseSchema, FeedbackSchema


class OrchestrationService:
    """Orchestrates interview state, question rules, and session lifecycle."""

    def initialize_session(self, session_id: str, candidate_id: str) -> InterviewResponseSchema:
        """Initializes a new interview session for the authenticated candidate."""
        candidate_data = mongo_service.get_candidate_by_id(candidate_id)
        if not candidate_data:
            raise ValueError(f"Candidate '{candidate_id}' not found.")

        target_days = candidate_analyzer.select_target_curriculum_days(
            candidate_data, count=settings.MIN_CURRICULUM_DAYS
        )
        initial_day = target_days[0] if target_days else 1

        candidate_summary = candidate_analyzer.generate_candidate_summary_prompt(candidate_data)
        day_context = curriculum_loader.format_day_context_for_prompt(initial_day)

        system_prompt = (
            "You are an expert technical interviewer conducting a live assessment.\n"
            f"{candidate_summary}\n\n"
            f"CURRENT ASSESSED DAY:\n{day_context}\n\n"
            "INSTRUCTIONS:\n"
            "- Ask ONE concise technical question (max 2 sentences) about the current day's topic.\n"
            "- Do NOT mention internal metrics, attempt scores, or day numbers to the candidate."
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Hello, I am ready to start the technical interview."}
        ]

        opening_question = groq_service.generate_opening_question(messages, model=settings.GROQ_FAST_MODEL)

        database_service.create_session(
            session_id=session_id,
            candidate_id=candidate_id,
            initial_history=messages + [{"role": "assistant", "content": opening_question}],
            assessed_days=[initial_day]
        )

        return InterviewResponseSchema(
            reply=opening_question,
            previousAnswerFeedback=None,
            isFollowUp=None,
            done=False,
            feedback=None,
        )

    def process_turn(self, session_id: str, candidate_message: str) -> InterviewResponseSchema:
        """Processes an incoming candidate turn, updates history, and determines next question/evaluation."""
        session = database_service.get_session(session_id)
        if not session:
            raise ValueError(f"Session '{session_id}' not found.")

        if session["is_completed"]:
            stored_reports = mongo_service.get_reports_for_candidate(session["candidate_id"])
            latest = next((r for r in stored_reports if r["sessionId"] == session_id), None)
            feedback_obj = FeedbackSchema(**latest["feedback"]) if latest else None
            return InterviewResponseSchema(
                reply="Interview already completed.",
                done=True,
                feedback=feedback_obj
            )

        history: List[Dict[str, str]] = json.loads(session["conversation_history"])
        assessed_days: List[int] = json.loads(session["assessed_days"])
        current_turn: int = session["current_turn"] + 1

        history.append({"role": "user", "content": candidate_message})

        has_min_questions = current_turn >= settings.MIN_QUESTIONS
        has_min_days = len(assessed_days) >= settings.MIN_CURRICULUM_DAYS

        if has_min_questions and has_min_days:
            return self._finalize_interview(session_id, session, history, assessed_days, current_turn)

        current_day = assessed_days[-1] if assessed_days else 1
        is_new_topic = False

        if current_turn % 2 == 0 and len(assessed_days) < settings.MIN_CURRICULUM_DAYS:
            all_days = curriculum_loader.get_all_days()
            next_days = [d for d in all_days if d not in assessed_days]
            if next_days:
                current_day = next_days[0]
                assessed_days.append(current_day)
                is_new_topic = True

        day_context = curriculum_loader.format_day_context_for_prompt(current_day)
        turn_prompt = (
            f"You are conducting turn {current_turn + 1} of a technical interview.\n"
            f"CURRENT TOPIC CONTEXT:\n{day_context}\n\n"
            "TASK: Look at the candidate's most recent answer and respond with STRICT JSON only:\n"
            "{\n"
            '  "feedback": "One short sentence evaluating the candidate\'s previous answer.",\n'
            '  "question": "The next interview question (max 2 sentences)."\n'
            "}\n\n"
            "INSTRUCTIONS:\n"
            "- If the previous answer was brief or incomplete, make 'question' a targeted follow-up on the same topic.\n"
            "- If it was complete, make 'question' transition to a new question on the current topic.\n"
            "- Keep both fields concise and professional. Return ONLY the JSON object."
        )

        history[0] = {"role": "system", "content": turn_prompt}

        turn_result = groq_service.generate_turn_response(history, model=settings.GROQ_FAST_MODEL)
        feedback_text = turn_result.get("feedback", "").strip()
        next_question = turn_result.get("question", "").strip()

        # Store only the question in history — keeps the transcript clean for
        # both the model's own context window and the final report generation.
        history.append({"role": "assistant", "content": next_question})

        database_service.update_session_history(
            session_id=session_id,
            history=history,
            current_turn=current_turn,
            assessed_days=assessed_days
        )

        return InterviewResponseSchema(
            reply=next_question,
            previousAnswerFeedback=feedback_text or None,
            isFollowUp=not is_new_topic,
            done=False,
            feedback=None,
        )

    def _finalize_interview(
        self,
        session_id: str,
        session: Dict[str, Any],
        history: List[Dict[str, str]],
        assessed_days: List[int],
        current_turn: int
    ) -> InterviewResponseSchema:
        """Concludes the interview: generates the report, computes metrics, and persists permanently to Mongo."""
        feedback_report = groq_service.generate_final_report(history, assessed_days)

        acoustic_metrics: List[Dict[str, Any]] = json.loads(session.get("acoustic_metrics") or "[]")
        feedback_report.metrics = metrics_service.compute_interview_metrics(
            acoustic_metrics=acoustic_metrics,
            total_turns=current_turn,
            assessed_days=assessed_days,
            target_curriculum_days=settings.MIN_CURRICULUM_DAYS,
        )

        closing_reply = (
            "Thank you for completing the technical interview! "
            "Your response submission has been evaluated and logged successfully."
        )

        # SQLite: marks the live session as done (fast "already completed" check on re-hit)
        database_service.mark_session_complete(
            session_id=session_id,
            history=history,
            current_turn=current_turn,
            assessed_days=assessed_days,
            feedback_report=feedback_report.model_dump()
        )

        # MongoDB: the permanent record used by candidate/admin report views
        mongo_service.save_interview_report({
            "sessionId": session_id,
            "candidateId": session["candidate_id"],
            "assessedDays": assessed_days,
            "feedback": feedback_report.model_dump(),
        })

        return InterviewResponseSchema(
            reply=closing_reply,
            previousAnswerFeedback=None,
            isFollowUp=None,
            done=True,
            feedback=feedback_report
        )


# Global singleton instance for app-wide import
orchestration_service = OrchestrationService()
