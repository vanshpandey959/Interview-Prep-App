import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radio, Mic, Square, Send, Loader2, GitBranch, Sparkles, MessageSquareQuote,
} from 'lucide-react';
import { RoundTimer } from '../components/RoundTimer';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { interviewApi, ApiError } from '../lib/api';
import { useAuthStore } from '../lib/authStore';

const makeSessionId = () =>
  (crypto?.randomUUID ? crypto.randomUUID() : `sess-${Date.now()}-${Math.random().toString(16).slice(2)}`);

export const InterviewPage = () => {
  const navigate = useNavigate();
  const { token, candidateId } = useAuthStore();
  const { isRecording, interimTranscript, finalTranscript, startRecording, stopRecording } = useSpeechToText();

  const sessionIdRef = useRef(makeSessionId());
  const [turns, setTurns] = useState([]); // { question, isFollowUp, feedback, answer }
  const [textInput, setTextInput] = useState('');
  const [starting, setStarting] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [startedAt, setStartedAt] = useState(null);
  const [inputMode, setInputMode] = useState('text'); // 'text' | 'voice'

  const aiPaneRef = useRef(null);
  const candidatePaneRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    interviewApi
      .start(sessionIdRef.current, token)
      .then((res) => {
        if (cancelled) return;
        setStartedAt(Date.now());
        setTurns([{ question: res.reply, isFollowUp: null, feedback: null, answer: null }]);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not start the interview.'))
      .finally(() => setStarting(false));
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    aiPaneRef.current?.scrollTo({ top: aiPaneRef.current.scrollHeight, behavior: 'smooth' });
    candidatePaneRef.current?.scrollTo({ top: candidatePaneRef.current.scrollHeight, behavior: 'smooth' });
  }, [turns]);

  const applyResponse = (res, answerText) => {
    setTurns((prev) => {
      const next = [...prev];
      next[next.length - 1] = { ...next[next.length - 1], answer: answerText };
      if (!res.done) {
        next.push({
          question: res.reply,
          isFollowUp: res.isFollowUp,
          feedback: res.previousAnswerFeedback,
          answer: null,
        });
      }
      return next;
    });

    if (res.done && res.feedback) {
      navigate('/report', {
        state: {
          feedback: res.feedback,
          meta: { sessionId: sessionIdRef.current, candidateId, completedAt: new Date().toISOString() },
        },
      });
    }
  };

  const handleSubmitText = async () => {
    const message = textInput.trim();
    if (!message || submitting) return;
    setSubmitting(true);
    setTextInput('');
    try {
      const res = await interviewApi.turn(sessionIdRef.current, message, token);
      applyResponse(res, message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to send your answer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      setSubmitting(true);
      try {
        const blob = await stopRecording();
        if (blob && blob.size > 0) {
          const res = await interviewApi.audio(sessionIdRef.current, blob, token);
          applyResponse(res, finalTranscript.trim() || '[voice response]');
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to process your recording.');
      } finally {
        setSubmitting(false);
      }
    } else {
      setInputMode('voice');
      startRecording();
    }
  };

  if (starting) {
    return (
      <div className="min-h-screen bg-[var(--color-base)] flex flex-col items-center justify-center gap-3 text-[var(--color-ink-dim)]">
        <Loader2 className="h-5 w-5 animate-spin" />
        <p className="text-sm font-[var(--font-mono)]">Opening your interview session…</p>
      </div>
    );
  }

  if (error && turns.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--color-base)] flex items-center justify-center px-6 text-center">
        <div>
          <p className="text-sm text-[var(--color-rose)] mb-4">{error}</p>
          <button onClick={() => navigate('/candidate')} className="text-sm text-[var(--color-brand-soft)]">
            Back to your profile
          </button>
        </div>
      </div>
    );
  }

  const status = isRecording ? 'listening' : submitting ? 'thinking' : 'speaking';
  const currentTurn = turns[turns.length - 1];

  return (
    <div className="h-screen bg-[var(--color-base)] text-[var(--color-ink)] flex flex-col overflow-hidden">
      <header className="shrink-0 flex items-center justify-between px-6 py-3.5 border-b border-[var(--color-border-soft)]">
        <div className="flex items-center gap-2">
          <span className="h-6 w-6 rounded-md bg-[var(--color-brand)] flex items-center justify-center">
            <Radio className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
          </span>
          <span className="font-[var(--font-display)] text-sm font-semibold">Signal</span>
          <span className="text-xs font-[var(--font-mono)] text-[var(--color-ink-faint)] ml-2">
            session &middot; {sessionIdRef.current.slice(0, 8)}
          </span>
        </div>
        <button
          onClick={() => navigate('/candidate')}
          className="text-xs text-[var(--color-ink-faint)] hover:text-[var(--color-ink-dim)]"
        >
          Exit session
        </button>
      </header>

      {error && (
        <div className="shrink-0 px-6 py-2 bg-[var(--color-rose)]/10 border-b border-[var(--color-rose)]/20 text-xs text-[var(--color-rose)] text-center">
          {error}
        </div>
      )}

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_280px_1fr]">
        {/* Left: AI questions / follow-ups / feedback */}
        <div className="min-h-0 flex flex-col border-b lg:border-b-0 lg:border-r border-[var(--color-border-soft)]">
          <div className="shrink-0 px-5 pt-4 pb-3">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-ink-faint)]">
              Interviewer
            </span>
          </div>
          <div ref={aiPaneRef} className="flex-1 overflow-y-auto scroll-thin px-5 pb-5 space-y-4">
            {turns.map((t, i) => (
              <div key={i} className="space-y-3">
                {t.feedback && (
                  <div className="rounded-xl border border-[var(--color-amber)]/25 bg-[var(--color-amber)]/[0.06] px-4 py-3">
                    <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-amber)] mb-1">
                      <MessageSquareQuote className="h-3 w-3" /> Feedback on your last answer
                    </p>
                    <p className="text-sm text-[var(--color-ink-dim)] leading-relaxed">{t.feedback}</p>
                  </div>
                )}
                <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-3.5">
                  {t.isFollowUp !== null && (
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider mb-1.5 ${
                        t.isFollowUp ? 'text-[var(--color-brand-soft)]' : 'text-[var(--color-mint)]'
                      }`}
                    >
                      <GitBranch className="h-3 w-3" /> {t.isFollowUp ? 'Follow-up' : 'New topic'}
                    </span>
                  )}
                  <p className="text-sm text-[var(--color-ink)] leading-relaxed">{t.question}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center: round timer */}
        <div className="hidden lg:flex flex-col items-center justify-center px-4 py-6">
          <RoundTimer startedAt={startedAt} status={status} size={200} />
          <p className="mt-6 text-[11px] text-[var(--color-ink-faint)] text-center max-w-[180px]">
            {isRecording
              ? 'Recording your answer — tap stop when you\u2019re done.'
              : 'Answer by voice or text on the right.'}
          </p>
        </div>
        <div className="lg:hidden flex justify-center py-3 border-b border-[var(--color-border-soft)]">
          <RoundTimer startedAt={startedAt} status={status} size={120} />
        </div>

        {/* Right: candidate answers + input */}
        <div className="min-h-0 flex flex-col">
          <div className="shrink-0 px-5 pt-4 pb-3 flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-ink-faint)]">
              You
            </span>
            {submitting && (
              <span className="flex items-center gap-1.5 text-[11px] text-[var(--color-ink-faint)]">
                <Loader2 className="h-3 w-3 animate-spin" /> processing
              </span>
            )}
          </div>

          <div ref={candidatePaneRef} className="flex-1 overflow-y-auto scroll-thin px-5 pb-3 space-y-3">
            {turns
              .filter((t) => t.answer)
              .map((t, i) => (
                <div key={i} className="ml-auto max-w-[92%] rounded-xl bg-[var(--color-brand-dim)]/30 border border-[var(--color-brand-dim)]/50 px-4 py-3">
                  <p className="text-sm text-[var(--color-ink)] leading-relaxed">{t.answer}</p>
                </div>
              ))}

            {isRecording && (
              <div className="ml-auto max-w-[92%] rounded-xl border border-[var(--color-signal)]/40 bg-[var(--color-signal)]/[0.06] px-4 py-3">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-signal-soft)] mb-1">
                  <Sparkles className="h-3 w-3" /> Live transcript
                </p>
                <p className="text-sm text-[var(--color-ink)] leading-relaxed">
                  {finalTranscript}
                  <span className="text-[var(--color-ink-faint)]">{interimTranscript}</span>
                  {!finalTranscript && !interimTranscript && (
                    <span className="text-[var(--color-ink-faint)]">Listening…</span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Input controls */}
          <div className="shrink-0 border-t border-[var(--color-border-soft)] p-4 space-y-3">
            <div className="flex gap-1.5">
              <button
                onClick={() => setInputMode('text')}
                disabled={isRecording}
                className={`flex-1 text-xs font-medium rounded-lg py-2 transition-colors ${
                  inputMode === 'text'
                    ? 'bg-[var(--color-surface)] text-[var(--color-ink)] border border-[var(--color-border)]'
                    : 'text-[var(--color-ink-faint)]'
                } disabled:opacity-40`}
              >
                Type answer
              </button>
              <button
                onClick={() => setInputMode('voice')}
                className={`flex-1 text-xs font-medium rounded-lg py-2 transition-colors ${
                  inputMode === 'voice'
                    ? 'bg-[var(--color-surface)] text-[var(--color-ink)] border border-[var(--color-border)]'
                    : 'text-[var(--color-ink-faint)]'
                }`}
              >
                Speak answer
              </button>
            </div>

            {inputMode === 'text' ? (
              <div className="flex items-end gap-2">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitText();
                    }
                  }}
                  disabled={submitting || !currentTurn || currentTurn.answer}
                  rows={3}
                  placeholder="Type your answer… (Enter to send, Shift+Enter for a new line)"
                  className="flex-1 resize-none rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-3.5 py-2.5 text-sm placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-brand-soft)] disabled:opacity-50"
                />
                <button
                  onClick={handleSubmitText}
                  disabled={submitting || !textInput.trim()}
                  className="shrink-0 h-10 w-10 rounded-lg bg-[var(--color-brand)] hover:bg-[var(--color-brand-soft)] transition-colors flex items-center justify-center disabled:opacity-40"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Send className="h-4 w-4 text-white" />}
                </button>
              </div>
            ) : (
              <button
                onClick={handleToggleRecording}
                disabled={submitting || !currentTurn || currentTurn.answer}
                className={`w-full flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium transition-colors disabled:opacity-40 ${
                  isRecording
                    ? 'bg-[var(--color-signal)] text-white hover:bg-[var(--color-signal-soft)]'
                    : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-ink)] hover:border-[var(--color-brand-soft)]'
                }`}
              >
                {isRecording ? (
                  <>
                    <Square className="h-4 w-4" /> Stop &amp; submit
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" /> Start speaking
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
