import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight, Radio, Mic, Gauge, GitBranch, ShieldCheck, LayoutDashboard,
  CheckCircle2, ChevronRight,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { useAuthStore } from '../lib/authStore';

const STEPS = [
  {
    n: '01',
    title: 'Work the curriculum',
    body: 'Candidates move through the cohort\u2019s day-by-day missions \u2014 each one logged, timestamped, scored.',
  },
  {
    n: '02',
    title: 'Sit the interview',
    body: 'An AI interviewer opens a session synced to the days you\u2019ve actually covered, by voice or text.',
  },
  {
    n: '03',
    title: 'Get diagnosed',
    body: 'Every answer is scored for substance and delivery \u2014 pace, filler words, pauses, follow-through.',
  },
  {
    n: '04',
    title: 'Close the gaps',
    body: 'A curriculum-linked report shows exactly which days to revisit before the next attempt.',
  },
];

const FEATURES = [
  {
    icon: Mic,
    title: 'Voice-native sessions',
    body: 'Speech-to-text captures the answer while acoustic metrics capture how it was delivered.',
  },
  {
    icon: GitBranch,
    title: 'Adaptive questioning',
    body: 'Follow-ups probe weak answers; new topics open once a curriculum day is demonstrated.',
  },
  {
    icon: Gauge,
    title: 'Delivery diagnostics',
    body: 'Pace, filler-word rate, and pause behaviour \u2014 scored separately from knowledge, never confused with confidence.',
  },
  {
    icon: LayoutDashboard,
    title: 'Cohort-wide visibility',
    body: 'Admins see completion rates and drill into any candidate\u2019s report without leaving the dashboard.',
  },
  {
    icon: ShieldCheck,
    title: 'Session-scoped access',
    body: 'Candidates only ever reach their own sessions and reports; admins see the full cohort.',
  },
  {
    icon: Radio,
    title: 'Curriculum-aware',
    body: 'Questions are drawn from the exact days a candidate completed \u2014 nothing untaught, nothing skipped.',
  },
];

export const HomePage = () => {
  const navigate = useNavigate();
  const { role, candidateId } = useAuthStore();

  const handleStartInterview = () => {
    if (role === 'candidate' && candidateId) navigate('/candidate');
    else navigate('/candidate/login');
  };

  return (
    <div className="min-h-screen bg-[var(--color-base)] text-[var(--color-ink)] font-[var(--font-sans)] overflow-x-hidden">
      {/* ambient backdrop */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[560px] w-[900px] rounded-full bg-[var(--color-brand)]/15 blur-[140px]" />
        <div className="absolute top-96 right-0 h-[400px] w-[400px] rounded-full bg-[var(--color-signal)]/10 blur-[130px]" />
      </div>

      <Navbar />

      {/* ---------------- Hero ---------------- */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-24 grid lg:grid-cols-[1.05fr_0.95fr] gap-16 items-center">
        <div className="fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs text-[var(--color-ink-dim)] mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-mint)] live-pulse" />
            Live for the current cohort &middot; 31-day AI track
          </div>

          <h1 className="font-[var(--font-display)] text-[2.75rem] sm:text-6xl leading-[1.03] font-semibold tracking-tight">
            The technical interview,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-brand-soft)] to-[var(--color-signal-soft)]">
              run by the curriculum
            </span>{' '}
            itself.
          </h1>

          <p className="mt-6 text-lg text-[var(--color-ink-dim)] max-w-lg leading-relaxed">
            Signal turns a cohort's completed missions into a live, adaptive interview \u2014
            then scores what was said and how it was said, side by side.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <button
              onClick={handleStartInterview}
              className="group inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] text-[var(--color-base)] font-medium pl-6 pr-5 py-3.5 hover:opacity-90 transition-opacity"
            >
              Start interview
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-1 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors"
            >
              See how it works
              <ChevronRight className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-12 flex items-center gap-8 border-t border-[var(--color-border-soft)] pt-6">
            {[
              ['31', 'curriculum days'],
              ['8', 'skill modules'],
              ['2', 'scores per answer'],
            ].map(([n, l]) => (
              <div key={l}>
                <p className="font-[var(--font-mono)] text-2xl font-semibold text-[var(--color-ink)]">{n}</p>
                <p className="text-xs text-[var(--color-ink-faint)]">{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Signature element: live interview session mock */}
        <div className="relative fade-up" style={{ animationDelay: '120ms' }}>
          <div className="float-slow rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-border-soft)]">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[var(--color-signal)] live-pulse" />
                <span className="text-xs font-[var(--font-mono)] text-[var(--color-ink-dim)]">
                  session · CAND-014
                </span>
              </div>
              <span className="font-[var(--font-mono)] text-xs text-[var(--color-ink-faint)]">14:32</span>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex gap-3">
                <span className="h-6 w-6 shrink-0 rounded-md bg-[var(--color-brand-dim)] flex items-center justify-center text-[10px] font-[var(--font-mono)] text-[var(--color-brand-soft)]">
                  AI
                </span>
                <p className="text-sm text-[var(--color-ink)] leading-relaxed">
                  Day 12 covered prompt engineering fundamentals. Walk me through how you'd
                  structure a prompt to keep an LLM's output inside a strict JSON schema.
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <div className="rounded-xl bg-[var(--color-base-raised)] px-4 py-3 max-w-[85%]">
                  <p className="text-sm text-[var(--color-ink-dim)] leading-relaxed">
                    I'd pin the schema in the system prompt, add one example, and set
                    temperature low \u2014 then validate and repair on parse failure&hellip;
                  </p>
                </div>
                <span className="h-6 w-6 shrink-0 rounded-md bg-[var(--color-surface-2)] flex items-center justify-center text-[10px] font-[var(--font-mono)] text-[var(--color-ink-dim)]">
                  C
                </span>
              </div>

              <div className="flex items-center gap-1 pl-9">
                {[3, 6, 4, 8, 5, 9, 3, 6, 4].map((h, i) => (
                  <span
                    key={i}
                    className="w-1 rounded-full bg-[var(--color-signal)]/50"
                    style={{ height: `${h * 3}px` }}
                  />
                ))}
                <span className="ml-2 text-[10px] font-[var(--font-mono)] text-[var(--color-ink-faint)]">
                  transcribing&hellip;
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 divide-x divide-[var(--color-border-soft)] border-t border-[var(--color-border-soft)]">
              {[
                ['128', 'wpm'],
                ['96', 'fluency'],
                ['4/4', 'days covered'],
              ].map(([v, l]) => (
                <div key={l} className="px-4 py-3 text-center">
                  <p className="font-[var(--font-mono)] text-sm font-semibold text-[var(--color-ink)]">{v}</p>
                  <p className="text-[10px] text-[var(--color-ink-faint)]">{l}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute -bottom-5 -left-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 shadow-xl hidden sm:flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-[var(--color-mint)]" />
            <span className="text-xs text-[var(--color-ink-dim)]">Report generated in 4s</span>
          </div>
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-6 lg:px-8 py-20 border-t border-[var(--color-border-soft)]">
        <div className="max-w-xl mb-14">
          <span className="text-xs font-[var(--font-mono)] text-[var(--color-brand-soft)] uppercase tracking-wider">
            How it works
          </span>
          <h2 className="font-[var(--font-display)] text-3xl sm:text-4xl font-semibold mt-3 tracking-tight">
            From missions to a score, in one loop.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--color-border-soft)] rounded-2xl overflow-hidden border border-[var(--color-border-soft)]">
          {STEPS.map((step) => (
            <div key={step.n} className="bg-[var(--color-base)] p-6 flex flex-col gap-4">
              <span className="font-[var(--font-mono)] text-sm text-[var(--color-ink-faint)]">{step.n}</span>
              <h3 className="font-[var(--font-display)] text-lg font-medium">{step.title}</h3>
              <p className="text-sm text-[var(--color-ink-dim)] leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- Feature grid ---------------- */}
      <section id="product" className="max-w-7xl mx-auto px-6 lg:px-8 py-20 border-t border-[var(--color-border-soft)]">
        <div className="max-w-xl mb-14">
          <span className="text-xs font-[var(--font-mono)] text-[var(--color-signal-soft)] uppercase tracking-wider">
            Built for both sides of the table
          </span>
          <h2 className="font-[var(--font-display)] text-3xl sm:text-4xl font-semibold mt-3 tracking-tight">
            Everything the interview needs, nothing it doesn't.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 hover:border-[var(--color-brand-dim)] transition-colors"
              >
                <span className="h-9 w-9 rounded-lg bg-[var(--color-base-raised)] flex items-center justify-center mb-4">
                  <Icon className="h-4.5 w-4.5 text-[var(--color-brand-soft)]" />
                </span>
                <h3 className="font-medium text-[var(--color-ink)] mb-1.5">{f.title}</h3>
                <p className="text-sm text-[var(--color-ink-dim)] leading-relaxed">{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------------- Curriculum strip ---------------- */}
      <section id="curriculum" className="max-w-7xl mx-auto px-6 lg:px-8 py-20 border-t border-[var(--color-border-soft)]">
        <div className="rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-base-raised)] p-8 sm:p-10">
          <span className="text-xs font-[var(--font-mono)] text-[var(--color-amber)] uppercase tracking-wider">
            AI Cohort &middot; 31 days &middot; 8 modules
          </span>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              'Environment & Tooling', 'Data Foundations', 'Embeddings & Vector Search',
              'LLM Core & Prompting', 'Chatbot Application Build', 'Agentic AI & MCP',
              'Evaluation & Deployment', 'Production & Capstone',
            ].map((m) => (
              <span
                key={m}
                className="text-xs text-[var(--color-ink-dim)] border border-[var(--color-border)] rounded-full px-3 py-1.5"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- CTA band ---------------- */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] px-8 py-14 sm:px-16 text-center">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-[var(--color-brand)]/20 blur-[100px]" />
          </div>
          <h2 className="relative font-[var(--font-display)] text-3xl sm:text-4xl font-semibold tracking-tight">
            Ready to see where you stand?
          </h2>
          <p className="relative mt-3 text-[var(--color-ink-dim)] max-w-md mx-auto">
            Log in with your candidate ID and pick up your next interview in under a minute.
          </p>
          <button
            onClick={handleStartInterview}
            className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] text-[var(--color-base)] font-medium pl-6 pr-5 py-3.5 hover:opacity-90 transition-opacity"
          >
            Start interview
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <footer className="border-t border-[var(--color-border-soft)] py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--color-ink-faint)]">
          <div className="flex items-center gap-2">
            <Radio className="h-3.5 w-3.5" />
            Signal &middot; AI Technical Interviewer
          </div>
          <span>Built for the AI Cohort curriculum.</span>
        </div>
      </footer>
    </div>
  );
};