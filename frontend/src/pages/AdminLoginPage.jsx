import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, ArrowRight, Lock } from 'lucide-react';
import { authApi, ApiError } from '../lib/api';
import { useAuthStore } from '../lib/authStore';
import { Spinner } from '../components/Spinner';

export const AdminLoginPage = () => {
  const navigate = useNavigate();
  const loginAsAdmin = useAuthStore((s) => s.loginAsAdmin);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.loginAdmin(password);
      loginAsAdmin(res.accessToken);
      navigate('/admin');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-base)] text-[var(--color-ink)] flex items-center justify-center px-6 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-[var(--color-brand)]/15 blur-[140px]" />

      <div className="relative w-full max-w-sm">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 mb-10 mx-auto"
        >
          <span className="h-7 w-7 rounded-md bg-[var(--color-brand)] flex items-center justify-center">
            <Radio className="h-4 w-4 text-white" strokeWidth={2.5} />
          </span>
          <span className="font-[var(--font-display)] font-semibold">Signal</span>
        </button>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
          <div className="h-10 w-10 rounded-lg bg-[var(--color-base-raised)] flex items-center justify-center mb-5">
            <Lock className="h-4.5 w-4.5 text-[var(--color-brand-soft)]" />
          </div>
          <h1 className="font-[var(--font-display)] text-2xl font-semibold mb-1.5">Admin login</h1>
          <p className="text-sm text-[var(--color-ink-dim)] mb-7">
            Access the cohort dashboard and every candidate's reports.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--color-ink-dim)] mb-1.5">
                Admin password
              </label>
              <input
                type="password"
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-brand-soft)]"
              />
            </div>

            {error && <p className="text-xs text-[var(--color-rose)]">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-brand)] hover:bg-[var(--color-brand-soft)] transition-colors text-white font-medium py-2.5 disabled:opacity-60"
            >
              {loading ? <Spinner size={16} /> : (
                <>
                  Log in <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <button
          onClick={() => navigate('/candidate/login')}
          className="w-full text-center text-xs text-[var(--color-ink-faint)] hover:text-[var(--color-ink-dim)] mt-5"
        >
          Not an admin? Log in as a candidate instead
        </button>
      </div>
    </div>
  );
};
