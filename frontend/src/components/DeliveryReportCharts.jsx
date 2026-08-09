import React from 'react';
import { Mic, MicOff, Clock, Repeat, GitBranch, MapPin } from 'lucide-react';

const Gauge = ({ value, label, color }) => {
  const clamped = Math.max(0, Math.min(100, value ?? 0));
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-28 w-28">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--color-border)" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-[var(--font-mono)] text-2xl font-semibold text-[var(--color-ink)]">
            {clamped}
          </span>
          <span className="text-[10px] text-[var(--color-ink-faint)]">/ 100</span>
        </div>
      </div>
      <span className="text-xs font-medium text-[var(--color-ink-dim)] text-center">{label}</span>
    </div>
  );
};

const MetricTile = ({ icon: Icon, label, value, hint }) => (
  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 flex items-start gap-3">
    <span className="mt-0.5 h-7 w-7 shrink-0 rounded-md bg-[var(--color-base-raised)] flex items-center justify-center text-[var(--color-ink-dim)]">
      <Icon className="h-3.5 w-3.5" />
    </span>
    <div className="min-w-0">
      <p className="font-[var(--font-mono)] text-base font-semibold text-[var(--color-ink)] leading-tight">
        {value}
      </p>
      <p className="text-[11px] text-[var(--color-ink-faint)] mt-0.5">{label}</p>
      {hint && <p className="text-[10px] text-[var(--color-ink-faint)]/70 mt-0.5">{hint}</p>}
    </div>
  </div>
);

const SplitBar = ({ segments }) => {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  return (
    <div className="space-y-2">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-base-raised)]">
        {segments.map((s) => (
          <div
            key={s.label}
            style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
            className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-700"
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5 text-[11px] text-[var(--color-ink-dim)]">
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
            {s.label} · {s.value}
          </div>
        ))}
      </div>
    </div>
  );
};

export const DeliveryReportCharts = ({ metrics }) => {
  if (!metrics) return null;

  const {
    hasVoiceData,
    avgWordsPerMinute = 0,
    paceLabel = 'N/A',
    totalFillerWords = 0,
    fillerWordsPerMinute = 0,
    totalPauseCount = 0,
    longestPauseSeconds = 0,
    fluencyScore = 0,
    deliveryScore = 0,
    totalQuestionsAsked = 0,
    followUpQuestions = 0,
    newTopicQuestions = 0,
    curriculumDaysCovered = 0,
    targetCurriculumDays = 0,
  } = metrics;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-[var(--color-brand-soft)] uppercase tracking-wider">
          Delivery &amp; Structure Diagnostic
        </h3>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${
            hasVoiceData
              ? 'bg-[var(--color-mint)]/10 text-[var(--color-mint)]'
              : 'bg-[var(--color-ink-faint)]/10 text-[var(--color-ink-faint)]'
          }`}
        >
          {hasVoiceData ? <Mic className="h-3 w-3" /> : <MicOff className="h-3 w-3" />}
          {hasVoiceData ? 'Voice session' : 'Text-only session'}
        </span>
      </div>

      {/* Composite scores */}
      <div className="flex flex-wrap items-center justify-center gap-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] py-6">
        <Gauge value={fluencyScore} label="Fluency score" color="var(--color-brand-soft)" />
        <Gauge value={deliveryScore} label="Delivery score" color="var(--color-mint)" />
      </div>
      <p className="text-[11px] text-[var(--color-ink-faint)] -mt-3 text-center">
        Fluency and delivery describe speech pace, filler rate, and pause patterns — not the
        candidate's confidence or knowledge.
      </p>

      {/* Speech metrics */}
      {hasVoiceData && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <MetricTile
            icon={Clock}
            label="Pace"
            value={`${Math.round(avgWordsPerMinute)} wpm`}
            hint={paceLabel}
          />
          <MetricTile
            icon={Repeat}
            label="Filler words"
            value={totalFillerWords}
            hint={`${fillerWordsPerMinute.toFixed?.(1) ?? fillerWordsPerMinute}/min`}
          />
          <MetricTile
            icon={Clock}
            label="Pauses"
            value={totalPauseCount}
            hint={`longest ${longestPauseSeconds.toFixed?.(1) ?? longestPauseSeconds}s`}
          />
        </div>
      )}

      {/* Question mix */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--color-ink-dim)] flex items-center gap-1.5">
            <GitBranch className="h-3.5 w-3.5" /> Question mix
          </span>
          <span className="text-xs text-[var(--color-ink-faint)]">{totalQuestionsAsked} total</span>
        </div>
        <SplitBar
          segments={[
            { label: 'Follow-up', value: followUpQuestions, color: 'var(--color-brand-soft)' },
            { label: 'New topic', value: newTopicQuestions, color: 'var(--color-mint)' },
          ]}
        />
      </div>

      {/* Curriculum coverage */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--color-ink-dim)] flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" /> Curriculum days covered
          </span>
          <span className="font-[var(--font-mono)] text-xs text-[var(--color-ink)]">
            {curriculumDaysCovered} / {targetCurriculumDays || '—'}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-[var(--color-base-raised)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--color-amber)] transition-all duration-700"
            style={{
              width: `${targetCurriculumDays ? Math.min(100, (curriculumDaysCovered / targetCurriculumDays) * 100) : 0}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
};
