import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Radio, ArrowRight, Search, Check } from 'lucide-react';
import { authApi, candidatesApi, ApiError } from '../lib/api';
import { useAuthStore } from '../lib/authStore';
import { Spinner } from '../components/Spinner';

export const CandidateLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/candidate';
  const loginAsCandidate = useAuthStore((s) => s.loginAsCandidate);

  const [candidates, setCandidates] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    candidatesApi
      .list()
      .then((res) => setCandidates(res.candidates || []))
      .catch(() => setError('Could not load the candidate list. Is the API running?'))
      .finally(() => setLoadingList(false));
  }, []);

  const filtered = useMemo(() => {
    if (!query) return candidates;
    const q = query.toLowerCase();
    return candidates.filter(
      (c) => c.member?.name?.toLowerCase().includes(q) || c.member?.id?.toLowerCase().includes(q)
    );
  }, [candidates, query]);

  const selected = candidates.find((c) => c.member?.id === selectedId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedId) {
      setError('Pick your candidate profile first.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await authApi.loginCandidate(selectedId, password);
      loginAsCandidate(res.accessToken, res.candidateId);
      navigate(redirectTo);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-base)] text-[var(--color-ink)] flex items-center justify-center px-6 py-16 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-[var(--color-signal)]/10 blur-[140px]" />

      <div className="relative w-full max-w-md">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 mb-10 mx-auto">
          <span className="h-7 w-7 rounded-md bg-[var(--color-brand)] flex items-center justify-center">
            <Radio className="h-4 w-4 text-white" strokeWidth={2.5} />
          </span>
          <span className="font-[var(--font-display)] font-semibold">Signal</span>
        </button>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
          <h1 className="font-[var(--font-display)] text-2xl font-semibold mb-1.5">Candidate login</h1>
          <p className="text-sm text-[var(--color-ink-dim)] mb-6">
            Find your profile below, then enter the shared candidate password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--color-ink-dim)] mb-1.5">
                Your profile
              </label>

              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-ink-faint)]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or ID…"
                  className="w-full rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border)] pl-8 pr-3 py-2.5 text-sm placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-brand-soft)]"
                />
              </div>

              <div className="max-h-52 overflow-y-auto scroll-thin rounded-lg border border-[var(--color-border)] divide-y divide-[var(--color-border-soft)]">
                {loadingList && (
                  <div className="flex items-center justify-center py-8">
                    <Spinner size={18} className="border-[var(--color-border)] border-t-[var(--color-brand-soft)]" />
                  </div>
                )}
                {!loadingList && filtered.length === 0 && (
                  <p className="text-xs text-[var(--color-ink-faint)] text-center py-6">No matches.</p>
                )}
                {filtered.map((c) => {
                  const active = c.member?.id === selectedId;
                  return (
                    <button
                      type="button"
                      key={c.member.id}
                      onClick={() => setSelectedId(c.member.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left transition-colors ${
                        active ? 'bg-[var(--color-brand-dim)]/30' : 'hover:bg-[var(--color-base-raised)]'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-[var(--color-ink)] truncate">{c.member.name}</p>
                        <p className="text-[11px] text-[var(--color-ink-faint)] truncate">
                          {c.member.id} &middot; {c.member.jobRole}
                        </p>
                      </div>
                      {active && <Check className="h-4 w-4 text-[var(--color-brand-soft)] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-ink-dim)] mb-1.5">
                Candidate password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border)] px-3.5 py-2.5 text-sm placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-brand-soft)]"
              />
            </div>

            {error && <p className="text-xs text-[var(--color-rose)]">{error}</p>}

            <button
              type="submit"
              disabled={submitting || !selected}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-ink)] hover:opacity-90 transition-opacity text-[var(--color-base)] font-medium py-2.5 disabled:opacity-50"
            >
              {submitting ? <Spinner size={16} className="border-black/20 border-t-black" /> : (
                <>
                  Continue as {selected ? selected.member.name.split(' ')[0] : '…'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <button
          onClick={() => navigate('/admin/login')}
          className="w-full text-center text-xs text-[var(--color-ink-faint)] hover:text-[var(--color-ink-dim)] mt-5"
        >
          Here to review the cohort? Log in as admin instead
        </button>
      </div>
    </div>
  );
};