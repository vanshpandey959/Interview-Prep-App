import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  GraduationCap, Flame, Target, Calendar, FileText, ChevronRight,
  BadgeCheck, CircleDashed, XCircle,
} from 'lucide-react';
import { CandidateSidebar } from '../components/CandidateSidebar';
import { StatCard } from '../components/StatCard';
import { FullPageLoader } from '../components/Spinner';
import { candidatesApi, reportsApi, ApiError } from '../lib/api';
import { useAuthStore } from '../lib/authStore';

export const CandidatePage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'reports' ? 'reports' : 'profile';

  const { token, candidateId, logout } = useAuthStore();

  const [candidate, setCandidate] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingReports, setLoadingReports] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    candidatesApi
      .get(candidateId)
      .then(setCandidate)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load your profile.'))
      .finally(() => setLoading(false));
  }, [candidateId]);

  useEffect(() => {
    if (tab !== 'reports') return;
    setLoadingReports(true);
    reportsApi
      .forCandidate(candidateId, token)
      .then((res) => setReports(res.reports || []))
      .catch(() => setReports([]))
      .finally(() => setLoadingReports(false));
  }, [tab, candidateId, token]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const openReport = (report) => {
    navigate('/report', {
      state: { feedback: report.feedback, meta: { ...report, candidateName: candidate?.member?.name } },
    });
  };

  if (loading) return <FullPageLoader label="Loading your profile…" />;

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--color-base)] flex items-center justify-center text-sm text-[var(--color-rose)]">
        {error}
      </div>
    );
  }

  const { member, signals, missions } = candidate;
  const passed = missions?.filter((m) => m.passed).length || 0;

  return (
    <div className="min-h-screen bg-[var(--color-base)] text-[var(--color-ink)] flex">
      <CandidateSidebar
        name={member.name}
        jobRole={member.jobRole}
        tab={tab}
        onTabChange={(t) => setSearchParams({ tab: t })}
        onStartInterview={() => navigate('/interview')}
        onLogout={handleLogout}
      />

      <main className="flex-1 min-w-0 px-8 py-8 max-w-5xl">
        {tab === 'profile' ? (
          <div>
            <div className="mb-8">
              <span className="text-xs font-[var(--font-mono)] text-[var(--color-ink-faint)]">{member.id}</span>
              <h1 className="font-[var(--font-display)] text-3xl font-semibold mt-1">{member.name}</h1>
              <p className="text-sm text-[var(--color-ink-dim)] mt-1">
                {member.jobRole} &middot; {member.yearsExperience} yrs experience &middot; {member.education}
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mb-10">
              <StatCard label="Commit days" value={signals?.commitDays ?? '—'} icon={Flame} accent="signal" />
              <StatCard
                label="Missions completed"
                value={`${signals?.missionsCompleted ?? 0}/${missions?.length ?? 0}`}
                icon={GraduationCap}
                accent="brand"
              />
              <StatCard label="First-try passes" value={signals?.missionsFirstTry ?? '—'} icon={Target} accent="mint" />
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <h2 className="text-sm font-semibold text-[var(--color-ink-dim)] mb-4">
                Interviews taken &middot; missions ({passed}/{missions?.length ?? 0} passed)
              </h2>
              <div className="space-y-2">
                {missions?.map((m) => (
                  <div
                    key={m.day}
                    className="flex items-center justify-between rounded-lg border border-[var(--color-border-soft)] px-4 py-2.5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {m.passed ? (
                        <BadgeCheck className="h-4 w-4 text-[var(--color-mint)] shrink-0" />
                      ) : m.skipped ? (
                        <CircleDashed className="h-4 w-4 text-[var(--color-ink-faint)] shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-[var(--color-rose)] shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm text-[var(--color-ink)] truncate">{m.title}</p>
                        <p className="text-[11px] text-[var(--color-ink-faint)]">Day {m.day}</p>
                      </div>
                    </div>
                    {typeof m.attempts === 'number' && m.attempts > 0 && (
                      <span className="text-[11px] font-[var(--font-mono)] text-[var(--color-ink-faint)] shrink-0">
                        {m.attempts} attempt{m.attempts > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-8">
              <h1 className="font-[var(--font-display)] text-3xl font-semibold">My reports</h1>
              <p className="text-sm text-[var(--color-ink-dim)] mt-1">
                Every completed interview, most recent first.
              </p>
            </div>

            {loadingReports && <p className="text-sm text-[var(--color-ink-faint)]">Loading reports…</p>}

            {!loadingReports && reports.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-10 text-center">
                <FileText className="h-6 w-6 text-[var(--color-ink-faint)] mx-auto mb-3" />
                <p className="text-sm text-[var(--color-ink-dim)]">
                  You haven't completed an interview yet.
                </p>
                <button
                  onClick={() => navigate('/interview')}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-ink)] text-[var(--color-base)] text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity"
                >
                  Start your first interview
                </button>
              </div>
            )}

            <div className="space-y-2">
              {reports.map((r) => (
                <button
                  key={r.sessionId}
                  onClick={() => openReport(r)}
                  className="w-full flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 text-left hover:border-[var(--color-brand-dim)] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="h-9 w-9 rounded-lg bg-[var(--color-base-raised)] flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-[var(--color-brand-soft)]" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm text-[var(--color-ink)] truncate">
                        {r.assessedDays?.length
                          ? `Days ${r.assessedDays.join(', ')}`
                          : `Session ${r.sessionId}`}
                      </p>
                      <p className="text-[11px] text-[var(--color-ink-faint)] flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        {r.completedAt ? new Date(r.completedAt).toLocaleString() : 'Unknown date'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--color-ink-faint)] shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};