import React, { useMemo, useState } from 'react';
import { Search, Radio, LogOut, LayoutGrid, CheckCircle2, CircleDashed } from 'lucide-react';

export const AdminSidebar = ({ candidates, selectedId, onSelect, onOverview, onLogout }) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all | completed | pending

  const filtered = useMemo(() => {
    return candidates.filter((c) => {
      const matchesQuery =
        c.member?.name?.toLowerCase().includes(query.toLowerCase()) ||
        c.member?.id?.toLowerCase().includes(query.toLowerCase());
      const matchesFilter =
        filter === 'all' ||
        (filter === 'completed' && c.hasCompletedInterview) ||
        (filter === 'pending' && !c.hasCompletedInterview);
      return matchesQuery && matchesFilter;
    });
  }, [candidates, query, filter]);

  return (
    <aside className="w-72 shrink-0 h-screen sticky top-0 border-r border-[var(--color-border-soft)] bg-[var(--color-base-raised)] flex flex-col">
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-6">
          <span className="h-7 w-7 rounded-md bg-[var(--color-brand)] flex items-center justify-center">
            <Radio className="h-4 w-4 text-white" strokeWidth={2.5} />
          </span>
          <span className="font-[var(--font-display)] font-semibold text-[var(--color-ink)]">Signal</span>
          <span className="ml-auto text-[10px] uppercase tracking-wider text-[var(--color-ink-faint)] border border-[var(--color-border)] rounded px-1.5 py-0.5">
            Admin
          </span>
        </div>

        <button
          onClick={onOverview}
          className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm mb-4 transition-colors ${
            !selectedId
              ? 'bg-[var(--color-brand-dim)]/50 text-[var(--color-brand-soft)]'
              : 'text-[var(--color-ink-dim)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]'
          }`}
        >
          <LayoutGrid className="h-4 w-4" />
          Overview
        </button>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-ink-faint)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search candidates…"
            className="w-full rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] pl-8 pr-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-brand-soft)]"
          />
        </div>

        <div className="flex gap-1.5">
          {[
            { key: 'all', label: 'All' },
            { key: 'completed', label: 'Done' },
            { key: 'pending', label: 'Pending' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                filter === f.key
                  ? 'border-[var(--color-brand-soft)] text-[var(--color-brand-soft)] bg-[var(--color-brand-dim)]/30'
                  : 'border-[var(--color-border)] text-[var(--color-ink-faint)] hover:text-[var(--color-ink-dim)]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin px-3 pb-3">
        {filtered.length === 0 && (
          <p className="text-xs text-[var(--color-ink-faint)] text-center mt-8">No candidates match.</p>
        )}
        {filtered.map((c) => {
          const active = c.member?.id === selectedId;
          return (
            <button
              key={c.member.id}
              onClick={() => onSelect(c.member.id)}
              className={`w-full text-left rounded-lg px-3 py-2.5 mb-1 transition-colors ${
                active ? 'bg-[var(--color-surface)] border border-[var(--color-border)]' : 'hover:bg-[var(--color-surface)]/60'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-[var(--color-ink)] truncate">{c.member.name}</span>
                {c.hasCompletedInterview ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-mint)] shrink-0" />
                ) : (
                  <CircleDashed className="h-3.5 w-3.5 text-[var(--color-ink-faint)] shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-[var(--color-ink-faint)] truncate mt-0.5">{c.member.jobRole}</p>
            </button>
          );
        })}
      </div>

      <div className="border-t border-[var(--color-border-soft)] p-3">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--color-ink-dim)] hover:bg-[var(--color-surface)] hover:text-[var(--color-rose)] transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </aside>
  );
};
