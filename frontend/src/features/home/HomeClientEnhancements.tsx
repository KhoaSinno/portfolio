"use client";

import { useState } from "react";
import { Check, Copy, Mail } from "lucide-react";

export function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="group relative inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 backdrop-blur-md transition-all duration-200 hover:border-indigo-500/50 hover:bg-white/10 hover:text-white hover:shadow-lg hover:shadow-indigo-500/10 active:scale-95"
      title="Click to copy email address"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-emerald-400" />
          <span className="text-emerald-300 font-semibold">Copied to clipboard!</span>
        </>
      ) : (
        <>
          <Mail className="h-4 w-4 text-indigo-400 transition-transform group-hover:scale-110" />
          <span>{email}</span>
          <Copy className="ml-1 h-3.5 w-3.5 text-slate-400 opacity-60 transition-opacity group-hover:opacity-100" />
        </>
      )}
    </button>
  );
}
