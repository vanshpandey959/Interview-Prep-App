import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, Menu, X, ArrowUpRight } from 'lucide-react';
import { useAuthStore } from '../lib/authStore';

const NAV_LINKS = [
  { label: 'Product', href: '#product' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Curriculum', href: '#curriculum' },
];

export const Navbar = () => {
  const navigate = useNavigate();
  const { role, candidateId } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleStartInterview = () => {
    if (role === 'candidate' && candidateId) {
      navigate('/interview');
    } else {
      navigate('/candidate/login', { state: { from: '/interview' } });
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-colors duration-300 ${
        scrolled ? 'bg-[#0a0b10]/85 backdrop-blur-md border-b border-[var(--color-border-soft)]' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 group"
        >
          <span className="relative flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-brand)]">
            <Radio className="h-4 w-4 text-white" strokeWidth={2.5} />
          </span>
          <span className="font-[var(--font-display)] text-[17px] font-semibold tracking-tight text-[var(--color-ink)]">
            Signal
          </span>
        </button>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/login')}
            className="text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors px-3 py-2"
          >
            Admin login
          </button>
          <button
            onClick={handleStartInterview}
            className="group inline-flex items-center gap-1.5 rounded-full bg-[var(--color-ink)] text-[#0a0b10] text-sm font-medium pl-4 pr-3 py-2 hover:bg-white transition-colors"
          >
            Start interview
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>

        <button className="md:hidden text-[var(--color-ink)]" onClick={() => setOpen((v) => !v)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-[var(--color-border-soft)] bg-[#0a0b10] px-6 py-5 space-y-4">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block text-sm text-[var(--color-ink-dim)]"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-3 flex flex-col gap-2 border-t border-[var(--color-border-soft)]">
            <button
              onClick={() => { setOpen(false); navigate('/admin/login'); }}
              className="text-left text-sm text-[var(--color-ink-dim)]"
            >
              Admin login
            </button>
            <button
              onClick={() => { setOpen(false); handleStartInterview(); }}
              className="rounded-full bg-[var(--color-ink)] text-[#0a0b10] text-sm font-medium px-4 py-2.5"
            >
              Start interview
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
