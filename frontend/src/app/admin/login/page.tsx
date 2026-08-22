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

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-100 px-5">
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
      </form>
    </main>
  );
}
