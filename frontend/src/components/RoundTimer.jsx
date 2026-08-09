import React, { useEffect, useState } from 'react';

const formatDuration = (totalSeconds) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

/**
 * A round, clock-face style timer that counts UP from session start.
 * `active` pauses the sweep (but the digital readout keeps counting)
 * when false — used to show "listening" vs "thinking" states.
 */
export const RoundTimer = ({ startedAt, status = 'idle', size = 220 }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsedSeconds = startedAt ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0;
  // Sweep completes a full revolution every 60s, purely decorative/ambient.
  const sweepDeg = (elapsedSeconds % 60) * 6;

  const statusCopy = {
    idle: 'Waiting to begin',
    listening: 'Listening',
    thinking: 'AI is thinking',
    speaking: 'Question live',
  };

  const statusColor = {
    idle: 'var(--color-ink-faint)',
    listening: 'var(--color-signal)',
    thinking: 'var(--color-amber)',
    speaking: 'var(--color-mint)',
  };

  const radius = 46;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--color-border)" strokeWidth="2" />
          {/* tick marks */}
          {Array.from({ length: 60 }).map((_, i) => {
            const isMajor = i % 5 === 0;
            const angle = (i / 60) * 2 * Math.PI;
            const r1 = isMajor ? 40 : 42.5;
            const r2 = 44.5;
            const x1 = 50 + r1 * Math.cos(angle);
            const y1 = 50 + r1 * Math.sin(angle);
            const x2 = 50 + r2 * Math.cos(angle);
            const y2 = 50 + r2 * Math.sin(angle);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--color-border)"
                strokeWidth={isMajor ? 1.2 : 0.6}
              />
            );
          })}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={statusColor[status]}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (sweepDeg / 360) * circumference}
            style={{ transition: 'stroke-dashoffset 0.9s linear', opacity: 0.85 }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full ${status === 'listening' ? 'live-pulse' : ''}`}
            style={{ background: statusColor[status] }}
          />
          <span className="font-[var(--font-mono)] text-3xl sm:text-4xl font-semibold tabular-nums text-[var(--color-ink)]">
            {formatDuration(elapsedSeconds)}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-[var(--color-ink-faint)]">
            total duration
          </span>
        </div>
      </div>

      <span
        className="text-xs font-medium px-3 py-1 rounded-full border"
        style={{ color: statusColor[status], borderColor: statusColor[status] + '40' }}
      >
        {statusCopy[status]}
      </span>
    </div>
  );
};
