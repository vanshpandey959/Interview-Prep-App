import React from 'react';
import { Radio, LogOut, UserRound, FileClock, PlayCircle } from 'lucide-react';

export const CandidateSidebar = ({ name, jobRole, tab, onTabChange, onStartInterview, onLogout }) => {
  const items = [
    { key: 'profile', label: 'My Profile', icon: UserRound },
    { key: 'reports', label: 'My Reports', icon: FileClock },
  ];

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 border-r border-[var(--color-border-soft)] bg-[var(--color-base-raised)] flex flex-col">
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2 mb-6">
          <span className="h-7 w-7 rounded-md bg-[var(--color-brand)] flex items-center justify-center">
            <Radio className="h-4 w-4 text-white" strokeWidth={2.5} />
          </span>
          <span className="font-[var(--font-display)] font-semibold text-[var(--color-ink)]">abTalks</span>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <p className="text-sm font-medium text-[var(--color-ink)] truncate">{name}</p>
          <p className="text-[11px] text-[var(--color-ink-faint)] truncate">{jobRole}</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = tab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onTabChange(item.key)}
              className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active
                  ? 'bg-[var(--color-brand-dim)]/50 text-[var(--color-brand-soft)]'
                  : 'text-[var(--color-ink-dim)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-3 space-y-1 border-t border-[var(--color-border-soft)]">
        <button
          onClick={onStartInterview}
          className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-[var(--color-signal-soft)] hover:bg-[var(--color-signal)]/10 transition-colors"
        >
          <PlayCircle className="h-4 w-4" />
          New interview
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-[var(--color-ink-dim)] hover:bg-[var(--color-surface)] hover:text-[var(--color-rose)] transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </aside>
  );
};
