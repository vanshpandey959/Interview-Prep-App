import os
import asyncio
from typing import Dict, Any, List
from deepgram import DeepgramClient
from app.config import settings


class STTService:
    """Handles Speech-to-Text transcription and basic acoustic cadence extraction."""

    def __init__(self):
        self.api_key = getattr(settings, "DEEPGRAM_API_KEY", None) or os.getenv("DEEPGRAM_API_KEY")
        # Fix: Pass api_key explicitly as a keyword argument
        self.client = DeepgramClient(api_key=self.api_key) if self.api_key else None

    def _get_client(self) -> DeepgramClient:
        if not self.client:
            if self.api_key:
                # Fix: Pass api_key explicitly as a keyword argument
                self.client = DeepgramClient(api_key=self.api_key)
            else:
                raise ValueError("DEEPGRAM_API_KEY is missing from configuration.")
        return self.client

    async def transcribe_with_speech_metrics(
        self, 
        audio_bytes: bytes, 
        mimetype: str = "audio/wav"
    ) -> Dict[str, Any]:
        """
        Transcribes audio binary payload and extracts basic timing features 
        (words per minute, pause gaps, filler count).
        """
        client = self._get_client()

        # Current SDK (v5/v6) exposes prerecorded transcription as
        # client.listen.v1.media.transcribe_file(request=<bytes>, **options).
        # The older client.listen.rest.v("1").transcribe_file(payload, options)
        # shape (payload dict + options object) was removed in the v5 rewrite.
        response = await asyncio.to_thread(
            client.listen.v1.media.transcribe_file,
            request=audio_bytes,
            model="nova-2",
            smart_format=True,
            punctuate=True,
            utterances=True,
            filler_words=True,
            language="en-US",
        )

        try:
            # Safely handle object-attribute vs dictionary response shapes
            results = getattr(response, "results", None) or (response.get("results") if isinstance(response, dict) else {})
            channels = getattr(results, "channels", None) or (results.get("channels") if isinstance(results, dict) else [])
            
            first_channel = channels[0]
            alternatives = getattr(first_channel, "alternatives", None) or (first_channel.get("alternatives") if isinstance(first_channel, dict) else [])
            alternative = alternatives[0]

            transcript = (getattr(alternative, "transcript", None) or (alternative.get("transcript") if isinstance(alternative, dict) else "") or "").strip()
            words = getattr(alternative, "words", None) or (alternative.get("words") if isinstance(alternative, dict) else [])
            
            metadata = getattr(response, "metadata", None) or (response.get("metadata") if isinstance(response, dict) else {})
            duration = (getattr(metadata, "duration", None) or (metadata.get("duration") if isinstance(metadata, dict) else 0.0)) or 0.0

            # Extract basic timing and cadence metrics
            acoustic_metrics = self._analyze_timing_patterns(words, duration)

            return {
                "transcript": transcript,
                "metrics": acoustic_metrics
            }

        except (AttributeError, IndexError, KeyError, TypeError) as e:
            raise ValueError(f"Failed to parse Deepgram response: {str(e)}")

    def _analyze_timing_patterns(self, words: List[Any], duration: float) -> Dict[str, Any]:
        """Calculates WPM, pauses (>=500ms), and filler tokens from word timestamps."""
        if not words or duration <= 0:
            return {
                "durationSeconds": round(duration, 2),
                "wordsPerMinute": 0.0,
                "pauseCount": 0,
                "totalPauseDuration": 0.0,
                "fillersCount": 0
            }

        pauses = []
        fillers = 0
        filler_tokens = {"um", "uh", "hmm", "like", "ah"}

        for i in range(len(words)):
            w_obj = words[i]
            word_str = getattr(w_obj, "word", None) or (w_obj.get("word", "") if isinstance(w_obj, dict) else "")
            word_text = word_str.lower().strip(".,!?")

            if word_text in filler_tokens:
                fillers += 1

            if i < len(words) - 1:
                next_w = words[i + 1]
                w_end = getattr(w_obj, "end", None) or (w_obj.get("end", 0.0) if isinstance(w_obj, dict) else 0.0)
                next_start = getattr(next_w, "start", None) or (next_w.get("start", 0.0) if isinstance(next_w, dict) else 0.0)

                gap = next_start - w_end
                if gap >= 0.5:  # 500ms or longer considered a distinct pause
                    pauses.append(round(gap, 2))

        wpm = round((len(words) / duration) * 60, 1)

        return {
            "durationSeconds": round(duration, 2),
            "wordsPerMinute": wpm,
            "pauseCount": len(pauses),
            "totalPauseDuration": round(sum(pauses), 2),
            "longestPause": max(pauses) if pauses else 0.0,
            "fillersCount": fillers
        }


# Global singleton instance for app-wide import
stt_service = STTService()