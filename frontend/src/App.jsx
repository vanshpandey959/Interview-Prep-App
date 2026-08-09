import React, { useState } from 'react';
import { apiService } from './services/api';
import { CandidateSelector } from './components/CandidateSelector';
import { InterviewRoom } from './components/InterviewRoom';
import { EvaluationModal } from './components/EvaluationModal';

export default function App() {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Initialize Interview Session
  const handleStartInterview = async (newSessionId, candidateData) => {
    setIsLoading(true);
    try {
      const response = await apiService.sendJsonTurn({
        sessionId: newSessionId,
        candidate: candidateData,
      });

      setSessionId(newSessionId);
      setMessages([{ role: 'assistant', text: response.reply }]);
    } catch (err) {
      alert(`Error starting session: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Text Response Submission
  const handleSendText = async (textMessage) => {
    setMessages((prev) => [...prev, { role: 'user', text: textMessage }]);
    setIsLoading(true);

    try {
      const response = await apiService.sendJsonTurn({
        sessionId,
        message: textMessage,
      });

      setMessages((prev) => [...prev, { role: 'assistant', text: response.reply }]);

      if (response.done && response.feedback) {
        setFeedback(response.feedback);
      }
    } catch (err) {
      alert(`Error processing response: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Audio Recording Response Submission
  const handleSendAudio = async (audioBlob) => {
    setIsLoading(true);

    try {
      const response = await apiService.sendAudioTurn(sessionId, audioBlob);

      // Append temporary transcription placeholder or update assistant reply directly
      setMessages((prev) => [
        ...prev,
        { role: 'user', text: '[Voice Response Submitted]' },
        { role: 'assistant', text: response.reply },
      ]);

      if (response.done && response.feedback) {
        setFeedback(response.feedback);
      }
    } catch (err) {
      alert(`Error processing audio: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = () => {
    setSessionId(null);
    setMessages([]);
    setFeedback(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans antialiased text-slate-100 selection:bg-indigo-500 selection:text-white">
      {!sessionId ? (
        <CandidateSelector onStartInterview={handleStartInterview} isLoading={isLoading} />
      ) : (
        <InterviewRoom
          sessionId={sessionId}
          messages={messages}
          onSendText={handleSendText}
          onSendAudio={handleSendAudio}
          isLoading={isLoading}
        />
      )}

      {feedback && <EvaluationModal feedback={feedback} onRestart={handleRestart} />}
    </div>
  );
}