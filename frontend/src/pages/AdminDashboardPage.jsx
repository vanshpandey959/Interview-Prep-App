import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Users, CheckCircle2, CircleDashed, ClipboardCheck, GraduationCap,
  Flame, Target, ChevronRight, FileText, Calendar,
} from 'lucide-react';
import { AdminSidebar } from '../components/AdminSidebar';
import { StatCard } from '../components/StatCard';
import { FullPageLoader } from '../components/Spinner';
import { adminApi, ApiError } from '../lib/api';
import { useAuthStore } from '../lib/authStore';

export const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('candidate') || null;

  const { token, logout } = useAuthStore();

  const [candidates, setCandidates] = useState([]);
  const [overview, setOverview] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingReports, setLoadingReports] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([adminApi.overview(token), adminApi.candidates(token)])
      .then(([ov, cands]) => {
        setOverview(ov);
        setCandidates(cands.candidates || []);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!selectedId) {
      setReports([]);
      return;
    }
    setLoadingReports(true);
    adminApi
      .reportsForCandidate(selectedId, token)
      .then((res) => setReports(res.reports || []))
      .catch(() => setReports([]))
      .finally(() => setLoadingReports(false));
  }, [selectedId, token]);

  const handleSelect = useCallback((id) => setSearchParams({ candidate: id }), [setSearchParams]);
  const handleOverview = useCallback(() => setSearchParams({}), [setSearchParams]);
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const openReport = (report) => {
    navigate('/report', { state: { feedback: report.feedback, meta: { ...report, candidateName: selectedCandidate?.member?.name } } });
  };

  if (loading) return <FullPageLoader label="Loading dashboard…" />;

  const selectedCandidate = candidates.find((c) => c.member?.id === selectedId);

  return (
    <div className="min-h-screen bg-[var(--color-base)] text-[var(--color-ink)] flex">
      <AdminSidebar
        candidates={candidates}
        selectedId={selectedId}
        onSelect={handleSelect}
        onOverview={handleOverview}
        onLogout={handleLogout}
      />

      <main className="flex-1 min-w-0 px-8 py-8 max-w-6xl">
        {error && (
          <div className="mb-6 rounded-lg border border-[var(--color-rose)]/30 bg-[var(--color-rose)]/10 px-4 py-3 text-sm text-[var(--color-rose)]">
            {error}
          </div>
        )}

        {!selectedId && overview && (
          <>
            <div className="mb-8">
              <span className="text-xs font-[var(--font-mono)] text-[var(--color-brand-soft)] uppercase tracking-wider">
                Cohort overview
              </span>
              <h1 className="font-[var(--font-display)] text-3xl font-semibold mt-2">Where the cohort stands</h1>
              <p className="text-sm text-[var(--color-ink-dim)] mt-1">
                A snapshot across every registered candidate. Select one from the sidebar for their full report.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              <StatCard label="Total candidates" value={overview.totalCandidates} icon={Users} accent="brand" />
              <StatCard
                label="Completed interview"
                value={overview.candidatesInterviewed}
                icon={CheckCircle2}
                accent="mint"
              />
              <StatCard
                label="Not yet interviewed"
                value={overview.candidatesNotInterviewed}
                icon={CircleDashed}
                accent="amber"
              />
              <StatCard
                label="Total interviews run"
                value={overview.totalInterviewsCompleted}
                icon={ClipboardCheck}
                accent="signal"
              />
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-[var(--color-ink-dim)]">Completion rate</h2>
                <span className="font-[var(--font-mono)] text-sm text-[var(--color-ink)]">
                  {overview.totalCandidates
                    ? Math.round((overview.candidatesInterviewed / overview.totalCandidates) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-[var(--color-base-raised)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--color-brand)] to-[var(--color-mint)] transition-all duration-700"
                  style={{
                    width: `${
                      overview.totalCandidates
                        ? (overview.candidatesInterviewed / overview.totalCandidates) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <p className="text-xs text-[var(--color-ink-faint)] mt-3">
                {overview.candidatesInterviewed} of {overview.totalCandidates} candidates have sat at least one
                interview.
              </p>
            </div>
          </>
        )}

        {selectedId && selectedCandidate && (
          <CandidateDetail
            candidate={selectedCandidate}
            reports={reports}
            loadingReports={loadingReports}
            onOpenReport={openReport}
          />
        )}

        {selectedId && !selectedCandidate && (
          <p className="text-sm text-[var(--color-ink-faint)]">Candidate not found.</p>
        )}
      </main>
    </div>
  );
};

const CandidateDetail = ({ candidate, reports, loadingReports, onOpenReport }) => {
  const { member, signals, missions } = candidate;
  const passed = missions?.filter((m) => m.passed).length || 0;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="text-xs font-[var(--font-mono)] text-[var(--color-ink-faint)]">{member.id}</span>
          <h1 className="font-[var(--font-display)] text-3xl font-semibold mt-1">{member.name}</h1>
          <p className="text-sm text-[var(--color-ink-dim)] mt-1">
            {member.jobRole} &middot; {member.yearsExperience} yrs experience &middot; {member.education}
          </p>
        </div>
        <span
          className={`text-xs font-medium px-3 py-1.5 rounded-full ${
            candidate.hasCompletedInterview
              ? 'bg-[var(--color-mint)]/10 text-[var(--color-mint)]'
              : 'bg-[var(--color-ink-faint)]/10 text-[var(--color-ink-faint)]'
          }`}
        >
          {candidate.hasCompletedInterview ? 'Interview completed' : 'Not yet interviewed'}
        </span>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        <StatCard label="Commit days" value={signals?.commitDays ?? '—'} icon={Flame} accent="signal" />
        <StatCard label="Missions completed" value={`${signals?.missionsCompleted ?? 0}/${missions?.length ?? 0}`} icon={GraduationCap} accent="brand" />
        <StatCard label="First-try passes" value={signals?.missionsFirstTry ?? '—'} icon={Target} accent="mint" />
      </div>

      <div className="grid lg:grid-cols-[1fr_1.3fr] gap-6">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="text-sm font-semibold text-[var(--color-ink-dim)] mb-4">
            Curriculum progress ({passed}/{missions?.length ?? 0} passed)
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto scroll-thin pr-1">
            {missions?.map((m) => (
              <div
                key={m.day}
                className="flex items-center justify-between rounded-lg border border-[var(--color-border-soft)] px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-xs font-[var(--font-mono)] text-[var(--color-ink-faint)]">Day {m.day}</p>
                  <p className="text-sm text-[var(--color-ink)] truncate">{m.title}</p>
                </div>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                    m.passed
                      ? 'bg-[var(--color-mint)]/10 text-[var(--color-mint)]'
                      : m.skipped
                      ? 'bg-[var(--color-ink-faint)]/10 text-[var(--color-ink-faint)]'
                      : 'bg-[var(--color-rose)]/10 text-[var(--color-rose)]'
                  }`}
                >
                  {m.passed ? 'Passed' : m.skipped ? 'Skipped' : 'Failed'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="text-sm font-semibold text-[var(--color-ink-dim)] mb-4">Interview reports</h2>
          {loadingReports && <p className="text-xs text-[var(--color-ink-faint)]">Loading reports…</p>}
          {!loadingReports && reports.length === 0 && (
            <p className="text-xs text-[var(--color-ink-faint)]">No completed interviews yet.</p>
          )}
          <div className="space-y-2">
            {reports.map((r) => (
              <button
                key={r.sessionId}
                onClick={() => onOpenReport(r)}
                className="w-full flex items-center justify-between rounded-lg border border-[var(--color-border-soft)] px-4 py-3 text-left hover:border-[var(--color-brand-dim)] hover:bg-[var(--color-base-raised)] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="h-8 w-8 rounded-md bg-[var(--color-base-raised)] flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-[var(--color-brand-soft)]" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-[var(--color-ink)] truncate">Session {r.sessionId}</p>
                    <p className="text-[11px] text-[var(--color-ink-faint)] flex items-center gap-1">
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
      </div>
    </div>
  );
};
