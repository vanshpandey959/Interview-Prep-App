import React from 'react';

export const Spinner = ({ size = 18, className = '' }) => (
  <span
    className={`inline-block rounded-full border-2 border-white/20 border-t-white animate-spin ${className}`}
    style={{ width: size, height: size }}
  />
);

export const FullPageLoader = ({ label = 'Loading…' }) => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[var(--color-base)] text-[var(--color-ink-dim)]">
    <Spinner size={22} className="border-[var(--color-border)] border-t-[var(--color-brand-soft)]" />
    <p className="text-sm font-[var(--font-mono)]">{label}</p>
  </div>
);
