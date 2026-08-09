from typing import Any, Dict, List
from app.schemas import InterviewMetricsSchema


class MetricsService:
    """
    Computes deterministic, chart-ready delivery and interview-structure
    metrics from stored acoustic_metrics + turn/day session data.

    Deliberately separate from GroqService: nothing here is LLM-generated.
    fluencyScore / deliveryScore are heuristic composites built from pace,
    filler rate, and pause frequency — they describe speech DELIVERY
    patterns, not the candidate's actual confidence or psychological
    state. Treat/label them as such in the UI.
    """

    # Conversational speech generally falls ~110-160 WPM; outside that band
    # we label pace as slow/fast. These are rough, tunable thresholds, not
    # a validated benchmark.
    PACE_SLOW_THRESHOLD = 110.0
    PACE_FAST_THRESHOLD = 160.0
    PACE_IDEAL_CENTER = 135.0

    def compute_interview_metrics(
        self,
        acoustic_metrics: List[Dict[str, Any]],
        total_turns: int,
        assessed_days: List[int],
        target_curriculum_days: int,
    ) -> InterviewMetricsSchema:
        """Builds the InterviewMetricsSchema for a completed session."""

        # --- Question mix (derived from existing turn/day bookkeeping,
        # no new tracking required) ---
        # Every distinct day in assessed_days corresponds to one turn that
        # opened a new topic; every other turn was a follow-up drilling
        # into the current day's topic.
        new_topic_questions = len(assessed_days)
        follow_up_questions = max(0, total_turns - new_topic_questions)

        base = InterviewMetricsSchema(
            hasVoiceData=False,
            totalQuestionsAsked=total_turns,
            followUpQuestions=follow_up_questions,
            newTopicQuestions=new_topic_questions,
            curriculumDaysCovered=len(assessed_days),
            targetCurriculumDays=target_curriculum_days,
        )

        if not acoustic_metrics:
            # Candidate answered entirely via text — no acoustic data exists.
            return base

        # --- Aggregate acoustic metrics across all voice turns ---
        total_duration = sum(m.get("durationSeconds", 0.0) for m in acoustic_metrics)
        total_fillers = sum(m.get("fillersCount", 0) for m in acoustic_metrics)
        total_pause_count = sum(m.get("pauseCount", 0) for m in acoustic_metrics)
        total_pause_duration = sum(m.get("totalPauseDuration", 0.0) for m in acoustic_metrics)
        longest_pause = max((m.get("longestPause", 0.0) for m in acoustic_metrics), default=0.0)

        if total_duration <= 0:
            return base

        # Duration-weighted average WPM (longer turns count more)
        weighted_wpm_sum = sum(
            m.get("wordsPerMinute", 0.0) * m.get("durationSeconds", 0.0)
            for m in acoustic_metrics
        )
        avg_wpm = weighted_wpm_sum / total_duration

        filler_per_minute = total_fillers / (total_duration / 60)
        pause_per_minute = total_pause_count / (total_duration / 60)

        pace_label = self._pace_label(avg_wpm)
        fluency_score = self._fluency_score(filler_per_minute, pause_per_minute, longest_pause)
        pace_score = self._pace_score(avg_wpm)
        delivery_score = round((fluency_score + pace_score) / 2)

        base.hasVoiceData = True
        base.audioTurnsCount = len(acoustic_metrics)
        base.avgWordsPerMinute = round(avg_wpm, 1)
        base.paceLabel = pace_label
        base.totalFillerWords = total_fillers
        base.fillerWordsPerMinute = round(filler_per_minute, 2)
        base.totalPauseCount = total_pause_count
        base.totalPauseDurationSeconds = round(total_pause_duration, 2)
        base.longestPauseSeconds = round(longest_pause, 2)
        base.fluencyScore = fluency_score
        base.deliveryScore = delivery_score
        base.totalSpeakingDurationSeconds = round(total_duration, 2)

        return base

    def _pace_label(self, avg_wpm: float) -> str:
        if avg_wpm < self.PACE_SLOW_THRESHOLD:
            return "Slow"
        if avg_wpm > self.PACE_FAST_THRESHOLD:
            return "Fast"
        return "Ideal"

    def _pace_score(self, avg_wpm: float) -> int:
        """100 at the center of the ideal band, decaying with distance from it."""
        distance = abs(avg_wpm - self.PACE_IDEAL_CENTER)
        score = 100 - (distance / self.PACE_IDEAL_CENTER) * 100
        return max(0, min(100, round(score)))

    def _fluency_score(self, filler_per_minute: float, pause_per_minute: float, longest_pause: float) -> int:
        """
        100 minus penalties for filler rate, pause frequency, and any single
        pause well beyond a normal thinking-pause length (~3s).
        """
        score = 100.0
        score -= filler_per_minute * 4       # each filler/min costs 4 points
        score -= pause_per_minute * 3         # each pause/min costs 3 points
        score -= max(0.0, longest_pause - 3) * 5  # long outlier pauses cost extra
        return max(0, min(100, round(score)))


# Global singleton instance for app-wide import
metrics_service = MetricsService()
