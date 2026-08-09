import React, { useState } from 'react';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { AudioVisualizer } from './AudioVisualizer';

export const InterviewRoom = ({ sessionId, messages, onSendText, onSendAudio, isLoading }) => {
  const [textInput, setTextInput] = useState('');
  const { isRecording, interimTranscript, finalTranscript, startRecording, stopRecording } = useSpeechToText();

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim() || isLoading) return;
    onSendText(textInput);
    setTextInput('');
  };

  const handleStopAndSendAudio = async () => {
    const audioBlob = await stopRecording();
    if (audioBlob) {
      onSendAudio(audioBlob);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4 text-slate-100">
      {/* Header */}
      <header className="py-4 border-b border-slate-800 flex justify-between items-center">
        <div>
          <h2 className="font-bold text-lg text-indigo-400">Technical Interview Session</h2>
          <p className="text-xs text-slate-500">ID: {sessionId}</p>
        </div>
        <span className="flex items-center gap-2 text-xs px-3 py-1 bg-emerald-950/60 border border-emerald-800 text-emerald-400 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Active
        </span>
      </header>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-6 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-md ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
              }`}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-60">
                {msg.role === 'user' ? 'Candidate' : 'Interviewer AI'}
              </p>
              {msg.text}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl px-5 py-3.5 text-xs text-slate-400 animate-pulse">
              Interviewer is processing your response...
            </div>
          </div>
        )}
      </div>

      {/* Real-time Live Speech Display Overlay */}
      {isRecording && (
        <div className="mb-4 p-4 bg-indigo-950/60 border border-indigo-800/80 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              Live Speech Transcription
            </span>
            <AudioVisualizer />
          </div>
          <p className="text-sm text-slate-200 italic min-h-[1.5rem]">
            {finalTranscript} <span className="text-indigo-400 font-semibold">{interimTranscript}</span>
          </p>
        </div>
      )}

      {/* Controls Bar */}
      <div className="py-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          {/* Push-to-Talk Record Button */}
          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={isLoading}
              className="p-3.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-indigo-400 rounded-xl border border-slate-700 transition-all flex items-center gap-2"
              title="Speak Answer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z" />
              </svg>
              <span className="text-xs font-medium">Record</span>
            </button>
          ) : (
            <button
              onClick={handleStopAndSendAudio}
              className="p-3.5 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-red-600/30 animate-pulse"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              <span className="text-xs font-medium">Stop & Submit</span>
            </button>
          )}

          {/* Fallback Text Input */}
          <form onSubmit={handleTextSubmit} className="flex-1 flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={isRecording ? "Listening to voice input..." : "Or type your technical answer..."}
              disabled={isRecording || isLoading}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50 text-slate-100"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || isLoading || isRecording}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 font-medium text-xs rounded-xl transition-all"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};