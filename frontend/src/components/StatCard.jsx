import React from 'react';

export const StatCard = ({ label, value, sublabel, icon: Icon, accent = 'brand' }) => {
  const accentMap = {
    brand: 'text-[var(--color-brand-soft)] bg-[var(--color-brand-dim)]/40',
    signal: 'text-[var(--color-signal-soft)] bg-[var(--color-signal)]/10',
    mint: 'text-[var(--color-mint)] bg-[var(--color-mint)]/10',
    amber: 'text-[var(--color-amber)] bg-[var(--color-amber)]/10',
  };

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-ink-faint)]">
          {label}
        </span>
        {Icon && (
          <span className={`h-8 w-8 rounded-lg flex items-center justify-center ${accentMap[accent]}`}>
            <Icon className="h-4 w-4" strokeWidth={2} />
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-[var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
          {value}
        </span>
        {sublabel && <span className="text-xs text-[var(--color-ink-dim)]">{sublabel}</span>}
      </div>
    </div>
  );
};
