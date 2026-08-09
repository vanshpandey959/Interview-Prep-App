import { useState, useRef, useEffect, useCallback } from 'react';

export const useSpeechToText = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const isListeningRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Web Speech API is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let currentInterim = '';
      let currentFinal = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptChunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          currentFinal += transcriptChunk + ' ';
        } else {
          currentInterim += transcriptChunk;
        }
      }

      if (currentFinal) {
        setFinalTranscript((prev) => prev + currentFinal);
      }
      setInterimTranscript(currentInterim);
    };

    recognition.onerror = (err) => {
      // Ignore non-fatal network/no-speech glitches
      if (err.error === 'no-speech' || err.error === 'aborted') return;
      console.error('Web Speech API Error:', err.error);
    };

    // Auto-restart if browser unexpectedly drops recognition while user is recording
    recognition.onend = () => {
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch {
          // Ignore state collision errors
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      isListeningRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    setInterimTranscript('');
    setFinalTranscript('');
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Fallback MIME type for Cross-Browser Compatibility (Safari / Chrome)
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(250);

      // Start Web Speech Recognition safely
      if (recognitionRef.current) {
        isListeningRef.current = true;
        try {
          recognitionRef.current.start();
        } catch {
          // Handles cases where engine was active
        }
      }

      setIsRecording(true);
    } catch (err) {
      console.error('Failed to access microphone:', err);
      alert('Microphone access is required for recording.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || !isListeningRef.current) {
        setIsRecording(false);
        resolve(null);
        return;
      }

      isListeningRef.current = false;

      // Stop Web Speech Recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Engine already stopped
        }
      }

      // Handle MediaRecorder Termination
      mediaRecorderRef.current.onstop = () => {
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        setIsRecording(false);
        setInterimTranscript('');

        // Release microphone tracks
        if (mediaRecorderRef.current?.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
        }

        resolve(audioBlob);
      };

      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      } else {
        setIsRecording(false);
        resolve(null);
      }
    });
  }, []);

  return {
    isRecording,
    interimTranscript,
    finalTranscript,
    startRecording,
    stopRecording,
  };
};