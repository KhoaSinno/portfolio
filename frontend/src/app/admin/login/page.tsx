'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(true);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      const { error } = await getSupabaseBrowserClient().auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push(new URLSearchParams(window.location.search).get('next') || '/admin/resume');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not sign in.');
    } finally {
      setSubmitting(false);
    }
  }

  async function loginDemo() {
    setEmail('demo@gmail.com');
    setPassword('111111');
    setSubmitting(true);
    setMessage('');
    try {
      const { error } = await getSupabaseBrowserClient().auth.signInWithPassword({
        email: 'demo@gmail.com',
        password: '111111',
      });
      if (error) throw error;
      router.push(new URLSearchParams(window.location.search).get('next') || '/admin/resume');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not sign in with demo account. Please ensure user is registered in Supabase.',
      );
      setShowDemoModal(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center bg-zinc-100 px-5">
      {/* Auto Demo Welcome Prompt Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl border border-indigo-100 bg-white p-6 shadow-2xl shadow-indigo-950/15 animate-in zoom-in-95 duration-200 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100/80 shadow-xs text-2xl">
              ⚡
            </div>

            <h2 className="mt-3.5 text-lg font-bold text-zinc-900">
              Login with Demo Account?
            </h2>

            <p className="mt-1.5 text-xs leading-relaxed text-zinc-600">
              Would you like to quickly test and explore the multi-resume CMS platform with a pre-seeded Demo account?
            </p>

            <div className="mt-3.5 flex items-center justify-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/50 py-1.5 px-3 text-xs font-mono text-indigo-950">
              <span className="font-semibold text-indigo-700">demo@gmail.com</span>
              <span className="text-zinc-300">•</span>
              <span className="text-zinc-500">111111</span>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => void loginDemo()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
              >
                <span>{submitting ? 'Signing in…' : '🚀 Yes, Login with Demo'}</span>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowDemoModal(false)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-2 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 active:scale-[0.98]"
              >
                No, sign in with another account
              </button>
            </div>
          </div>
        </div>
      )}

      <form
        onSubmit={signIn}
        className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-7 shadow-lg shadow-zinc-200/50"
      >
        <div className="flex items-center gap-3.5">
          <div className="flex items-center rounded-xl bg-[#090d16] px-3.5 py-2 border border-slate-800 shadow-md">
            <img
              src="/logo.png"
              alt="Sinoo Hub Logo"
              className="h-7 w-auto object-contain"
            />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700">
              Sinoo Hub CMS
            </p>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">
              Admin sign in
            </h1>
          </div>
        </div>

        <p className="mt-3 text-xs text-zinc-500">
          Use the Supabase account listed in <code>ADMIN_EMAILS</code>.
        </p>

        <label className="mt-5 block text-sm font-medium text-zinc-700">
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="field mt-1"
            autoComplete="email"
            placeholder="admin@example.com"
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-zinc-700">
          Password
          <input
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="field mt-1"
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </label>

        {message && (
          <p className="mt-4 rounded-lg bg-red-50 p-2.5 text-xs font-medium text-red-600 border border-red-100">
            {message}
          </p>
        )}

        <button
          disabled={submitting}
          className="mt-6 w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
        >
          {submitting ? 'Signing in…' : 'Sign in to Hub'}
        </button>

        {/* Demo Account Box for Interviewers */}
        <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50/70 p-3.5 text-center">
          <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
            ⚡ Quick Demo for Interviewers
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            Explore the multi-resume CMS platform with pre-loaded mock profiles.
          </p>
          <div className="mt-2 flex items-center justify-center gap-2 text-[11px] font-mono text-indigo-950 bg-white/80 py-1 px-2.5 rounded-lg border border-indigo-200/60">
            <span>demo@gmail.com</span>
            <span className="text-zinc-300">|</span>
            <span>111111</span>
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={() => void loginDemo()}
            className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-60"
          >
            <span>🚀 1-Click Demo Login</span>
          </button>
        </div>
      </form>
    </main>
  );
}
