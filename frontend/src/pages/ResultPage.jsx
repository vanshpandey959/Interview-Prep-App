import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Sparkles, TrendingUp, AlertTriangle, ListChecks, RotateCcw, Calendar,
} from 'lucide-react';
import { DeliveryReportCharts } from '../components/DeliveryReportCharts';
import { useAuthStore } from '../lib/authStore';

export const ResultPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuthStore();
  const { feedback, meta } = location.state || {};

  if (!feedback) {
    return (
      <div className="min-h-screen bg-[var(--color-base)] flex flex-col items-center justify-center gap-4 text-center px-6">
        <p className="text-sm text-[var(--color-ink-dim)]">
          No report to show here — open one from your reports list.
        </p>
        <button
          onClick={() => navigate(role === 'admin' ? '/admin' : '/candidate')}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-brand-soft)]"
        >
          <ArrowLeft className="h-4 w-4" /> Go back
        </button>
      </div>
    );
  }

  const backTo = role === 'admin' ? '/admin' + (meta?.candidateId ? `?candidate=${meta.candidateId}` : '') : '/candidate?tab=reports';

  return (
    <div className="min-h-screen bg-[var(--color-base)] text-[var(--color-ink)]">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <button
          onClick={() => navigate(backTo)}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="mb-8">
          <span className="inline-flex items-center gap-1.5 text-xs font-[var(--font-mono)] text-[var(--color-mint)] uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" /> Interview completed
          </span>
          <h1 className="font-[var(--font-display)] text-3xl font-semibold mt-3">
            {meta?.candidateName ? `${meta.candidateName}'s evaluation` : 'Evaluation report'}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-[var(--color-ink-faint)]">
            {meta?.sessionId && <span className="font-[var(--font-mono)]">Session {meta.sessionId}</span>}
            {meta?.completedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {new Date(meta.completedAt).toLocaleString()}
              </span>
            )}
            {meta?.assessedDays?.length > 0 && <span>Days assessed: {meta.assessedDays.join(', ')}</span>}
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <h2 className="text-xs font-bold text-[var(--color-brand-soft)] uppercase tracking-wider mb-2">
              Executive summary
            </h2>
            <p className="text-sm text-[var(--color-ink-dim)] leading-relaxed">{feedback.summary}</p>
          </section>

          <div className="grid sm:grid-cols-2 gap-4">
            <section className="rounded-2xl border border-[var(--color-mint)]/25 bg-[var(--color-mint)]/[0.06] p-6">
              <h3 className="text-xs font-bold text-[var(--color-mint)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" /> Demonstrated strengths
              </h3>
              <ul className="space-y-2">
                {feedback.strengths?.map((s, i) => (
                  <li key={i} className="text-sm text-[var(--color-ink-dim)] flex gap-2 leading-relaxed">
                    <span className="text-[var(--color-mint)] mt-0.5">&bull;</span>
                    {s}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-[var(--color-amber)]/25 bg-[var(--color-amber)]/[0.06] p-6">
              <h3 className="text-xs font-bold text-[var(--color-amber)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" /> Identified knowledge gaps
              </h3>
              <ul className="space-y-2">
                {feedback.gaps?.map((g, i) => (
                  <li key={i} className="text-sm text-[var(--color-ink-dim)] flex gap-2 leading-relaxed">
                    <span className="text-[var(--color-amber)] mt-0.5">&bull;</span>
                    {g}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <h3 className="text-xs font-bold text-[var(--color-brand-soft)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <ListChecks className="h-3.5 w-3.5" /> Recommended next steps
            </h3>
            <ul className="space-y-2">
              {feedback.next?.map((n, i) => (
                <li key={i} className="text-sm text-[var(--color-ink-dim)] flex gap-2 leading-relaxed">
                  <span className="text-[var(--color-brand-soft)] mt-0.5">{i + 1}.</span>
                  {n}
                </li>
              ))}
            </ul>
          </section>

          {feedback.metrics && (
            <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <DeliveryReportCharts metrics={feedback.metrics} />
            </section>
          )}
        </div>

        {role === 'candidate' && (
          <button
            onClick={() => navigate('/interview')}
            className="mt-8 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-brand)] hover:bg-[var(--color-brand-soft)] transition-colors text-white font-medium py-3"
          >
            <RotateCcw className="h-4 w-4" /> Start a new interview
          </button>
        )}
      </div>
    </div>
  );
};
