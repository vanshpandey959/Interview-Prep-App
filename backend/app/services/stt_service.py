import os
import asyncio
from typing import Optional, Dict, Any
from deepgram import DeepgramClient, PrerecordedOptions, FileSource
from app.config import settings


class STTService:
    """Handles Speech-to-Text transcription using Deepgram API."""

    def __init__(self):
        # Initialize Deepgram client using central API key configuration
        self.api_key = getattr(settings, "DEEPGRAM_API_KEY", None) or os.getenv("DEEPGRAM_API_KEY")
        self.client = DeepgramClient(self.api_key) if self.api_key else None

    def _get_client(self) -> DeepgramClient:
        """Helper to ensure Deepgram client is initialized."""
        if not self.client:
            if self.api_key:
                self.client = DeepgramClient(self.api_key)
            else:
                raise ValueError("DEEPGRAM_API_KEY is missing from configuration.")
        return self.client

    async def transcribe_audio_bytes(
        self, 
        audio_bytes: bytes, 
        mimetype: str = "audio/wav"
    ) -> str:
        """
        Transcribes audio binary payload into text.
        
        Args:
            audio_bytes: Raw binary content of the audio file.
            mimetype: Media format string (e.g., 'audio/wav', 'audio/mp3', 'audio/webm').
            
        Returns:
            Transcript string extracted from Deepgram response.
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
            language="en-US"
        )

        # Run synchronous SDK call in thread pool to avoid blocking async loop
        response = await asyncio.to_thread(
            client.listen.rest.v5.transcribe_file,
            payload,
            options
        )

        # Extract transcript string from Deepgram JSON structure
        try:
            transcript = response.results.channels[0].alternatives[0].transcript
            return transcript.strip()
        except (AttributeError, IndexError, KeyError) as e:
            raise ValueError(f"Failed to parse transcript from Deepgram response: {str(e)}")


# Global singleton instance for app-wide import
stt_service = STTService()