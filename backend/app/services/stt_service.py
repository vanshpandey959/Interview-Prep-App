import os
import asyncio
from typing import Dict, Any, List
from deepgram import DeepgramClient, PrerecordedOptions, FileSource
from app.config import settings


class STTService:
    """Handles Speech-to-Text transcription and basic acoustic cadence extraction."""

    def __init__(self):
        self.api_key = getattr(settings, "DEEPGRAM_API_KEY", None) or os.getenv("DEEPGRAM_API_KEY")
        self.client = DeepgramClient(self.api_key) if self.api_key else None

    def _get_client(self) -> DeepgramClient:
        if not self.client:
            if self.api_key:
                self.client = DeepgramClient(self.api_key)
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

        payload: FileSource = {
            "buffer": audio_bytes,
            "mimetype": mimetype,
        }

        options = PrerecordedOptions(
            model="nova-2",
            smart_format=True,
            punctuate=True,
            utterances=True,
            filler_words=True,
            language="en-US"
        )

        response = await asyncio.to_thread(
            client.listen.rest.v5.transcribe_file,
            payload,
            options
        )

        try:
            channel = response.results.channels[0].alternatives[0]
            transcript = channel.transcript.strip()
            words = channel.words or []
            duration = getattr(response.metadata, "duration", 0.0) or 0.0

            # Extract basic timing and cadence metrics
            acoustic_metrics = self._analyze_timing_patterns(words, duration)

            return {
                "transcript": transcript,
                "metrics": acoustic_metrics
            }

        except (AttributeError, IndexError, KeyError) as e:
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
            word_text = words[i].word.lower().strip(".,!?")
            if word_text in filler_tokens:
                fillers += 1

            if i < len(words) - 1:
                gap = words[i + 1].start - words[i].end
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