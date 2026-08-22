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

  return <main className="grid min-h-screen place-items-center bg-zinc-100 px-5"><form onSubmit={signIn} className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Portfolio CMS</p><h1 className="mt-2 text-2xl font-semibold">Admin sign in</h1><p className="mt-2 text-sm text-zinc-600">Use the Supabase account listed in <code>ADMIN_EMAILS</code>.</p><label className="mt-5 block text-sm font-medium">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="field mt-1" autoComplete="email" /></label><label className="mt-4 block text-sm font-medium">Password<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="field mt-1" autoComplete="current-password" /></label>{message && <p className="mt-4 text-sm text-red-600">{message}</p>}<button disabled={submitting} className="mt-5 w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60">{submitting ? 'Signing in…' : 'Sign in'}</button></form></main>;
}
