"use client";

import { useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Link2,
  Loader2,
  Mail,
  MessageSquare,
  Send,
  UploadCloud,
  X,
} from "lucide-react";
import { API_BASE_URL, getApiErrorMessage } from "@/lib/api/client";

type ContactTopic = "HIRING" | "COLLABORATION" | "GENERAL";
type HiringJdMode = "link" | "file";

const TOPICS: Array<{ value: ContactTopic; label: string }> = [
  { value: "HIRING", label: "Hiring" },
  { value: "COLLABORATION", label: "Collaboration" },
  { value: "GENERAL", label: "General" },
];

const MAX_FILE_BYTES = 10 * 1024 * 1024;

function submitLabel(topic: ContactTopic) {
  if (topic === "HIRING") return "Send hiring inquiry";
  if (topic === "COLLABORATION") return "Send collaboration inquiry";
  return "Send message";
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ContactForm() {
  const [topic, setTopic] = useState<ContactTopic>("GENERAL");
  const [jdMode, setJdMode] = useState<HiringJdMode>("link");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [jdLink, setJdLink] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);

  const clearJd = () => {
    setJdLink("");
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const chooseTopic = (nextTopic: ContactTopic) => {
    setTopic(nextTopic);
    setErrorMessage(null);
    if (nextTopic !== "HIRING") clearJd();
  };

  const chooseMode = (mode: HiringJdMode) => {
    setJdMode(mode);
    setErrorMessage(null);
    if (mode === "link") {
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      setJdLink("");
    }
  };

  const setFile = (file?: File) => {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setErrorMessage("PDF is too large. Please attach a file under 10 MB.");
      return;
    }
    if (file.type !== "application/pdf") {
      setErrorMessage("Please attach a PDF file only.");
      return;
    }
    setSelectedFile(file);
    setJdLink("");
    setErrorMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    if (!email.trim() || !message.trim()) {
      setErrorMessage("Please enter your email and a short message before sending.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("topic", topic);
      formData.append("email", email.trim());
      formData.append("message", message.trim());
      if (topic === "HIRING" && jdMode === "link" && jdLink.trim()) {
        formData.append("jdLink", jdLink.trim());
      }
      if (topic === "HIRING" && jdMode === "file" && selectedFile) {
        formData.append("file", selectedFile);
      }
      if (honeypot.trim()) formData.append("honeypot", honeypot.trim());

      const response = await fetch(`${API_BASE_URL}/contact`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(
            response,
            "Unable to send your message. Please try again or email me directly.",
          ),
        );
      }
      setSubmitted(true);
      setEmail("");
      setMessage("");
      clearJd();
      window.setTimeout(() => successHeadingRef.current?.focus(), 0);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to send your message. Please try again or email me directly.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-200">
          <MessageSquare aria-hidden="true" className="h-3.5 w-3.5" />
          <span>DIRECT MESSAGE</span>
        </div>
        <h3 className="mt-3 text-xl font-bold text-white">Let&apos;s connect</h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-300">
          Tell me how I can help. I&apos;ll reply by email.
        </p>
      </div>

      {submitted ? (
        <div className="space-y-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/30">
            <CheckCircle2 aria-hidden="true" className="h-6 w-6" />
          </div>
          <div>
            <h4 ref={successHeadingRef} tabIndex={-1} className="text-base font-bold text-white outline-none">
              Message received
            </h4>
            <p className="mt-1 text-sm leading-relaxed text-slate-200">
              Thank you for reaching out. I&apos;ll reply by email.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="min-h-11 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
          >
            Send another message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <input
            aria-hidden="true"
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            name="website"
            value={honeypot}
            onChange={(event) => setHoneypot(event.target.value)}
          />

          <fieldset>
            <legend className="text-sm font-medium text-slate-200">
              What would you like to discuss?
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {TOPICS.map((item) => {
                const selected = item.value === topic;
                return (
                  <label
                    key={item.value}
                    className={`cursor-pointer rounded-xl border px-4 py-2 text-sm font-semibold transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-indigo-300 ${
                      selected
                        ? "border-indigo-400 bg-indigo-500/25 text-white shadow-sm shadow-indigo-950/40"
                        : "border-white/10 bg-slate-950/50 text-slate-300 hover:border-white/25 hover:bg-white/5"
                    }`}
                  >
                    <input
                      type="radio"
                      name="contact-topic"
                      value={item.value}
                      checked={selected}
                      onChange={() => chooseTopic(item.value)}
                      className="sr-only"
                    />
                    {item.label}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div>
            <label htmlFor="contact-email" className="text-sm font-medium text-slate-200">
              Email <span className="text-rose-300">*</span>
            </label>
            <div className="relative mt-2">
              <Mail aria-hidden="true" className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                id="contact-email"
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                className="min-h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 py-2.5 pl-10 pr-3 text-base text-white placeholder:text-slate-500 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 sm:text-sm"
              />
            </div>
          </div>

          {topic === "HIRING" && (
            <fieldset className="rounded-2xl border border-indigo-400/20 bg-indigo-500/[0.06] p-4">
              <legend className="text-sm font-medium text-slate-100">Job description <span className="font-normal text-slate-400">(optional)</span></legend>
              <div className="mt-2 flex flex-wrap items-baseline justify-end gap-2">
                <div className="flex rounded-lg border border-white/10 bg-slate-950/70 p-0.5" aria-label="JD input mode">
                  <button type="button" aria-pressed={jdMode === "link"} onClick={() => chooseMode("link")} className={`min-h-9 rounded-md px-3 text-xs font-semibold transition ${jdMode === "link" ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-slate-200"}`}>Paste link</button>
                  <button type="button" aria-pressed={jdMode === "file"} onClick={() => chooseMode("file")} className={`min-h-9 rounded-md px-3 text-xs font-semibold transition ${jdMode === "file" ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-slate-200"}`}>Attach PDF</button>
                </div>
              </div>

              {jdMode === "link" ? (
                <div className="relative mt-3">
                  <Link2 aria-hidden="true" className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input id="contact-jd-link" type="url" inputMode="url" value={jdLink} onChange={(event) => { setJdLink(event.target.value); setErrorMessage(null); }} placeholder="https://company.com/job-description" className="min-h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 py-2.5 pl-10 pr-3 text-base text-white placeholder:text-slate-500 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 sm:text-sm" />
                </div>
              ) : (
                <div className="mt-3">
                  <input ref={fileInputRef} id="contact-jd-file" type="file" accept="application/pdf,.pdf" onChange={(event) => setFile(event.target.files?.[0])} className="sr-only" />
                  {selectedFile ? (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-indigo-400/30 bg-slate-950/50 p-3">
                      <div className="flex min-w-0 items-center gap-2.5"><FileText aria-hidden="true" className="h-5 w-5 shrink-0 text-indigo-300" /><div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{selectedFile.name}</p><p className="text-xs text-slate-400">{formatFileSize(selectedFile.size)} · Private PDF</p></div></div>
                      <button type="button" onClick={clearJd} aria-label="Remove selected PDF" className="min-h-11 min-w-11 rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white"><X aria-hidden="true" className="mx-auto h-4 w-4" /></button>
                    </div>
                  ) : (
                    <label htmlFor="contact-jd-file" className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-slate-950/40 px-4 text-center transition hover:border-indigo-400/60 hover:bg-slate-950/70 focus-within:ring-2 focus-within:ring-indigo-400/30">
                      <UploadCloud aria-hidden="true" className="h-5 w-5 text-indigo-300" />
                      <span className="mt-2 text-sm font-semibold text-slate-100">Choose a PDF</span>
                      <span className="mt-1 text-xs text-slate-400">One private PDF · maximum 10 MB</span>
                    </label>
                  )}
                </div>
              )}
            </fieldset>
          )}

          <div>
            <label htmlFor="contact-message" className="text-sm font-medium text-slate-200">
              Message <span className="text-rose-300">*</span>
            </label>
            <div className="relative mt-2">
              <MessageSquare aria-hidden="true" className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <textarea id="contact-message" required rows={4} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Tell me a little about the role, idea, or project…" className="w-full resize-y rounded-xl border border-white/10 bg-slate-950/60 py-3 pl-10 pr-3 text-base leading-relaxed text-white placeholder:text-slate-500 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 sm:text-sm" />
            </div>
          </div>

          <p className="text-xs leading-relaxed text-slate-400">Your message is used only to reply to you. Hiring attachments are private and visible only to the portfolio owner.</p>

          {errorMessage && (
            <p role="alert" className="flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm leading-relaxed text-rose-100"><AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />{errorMessage}</p>
          )}

          <button type="submit" disabled={submitting} className="group flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200 disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? <><Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />Sending…</> : <>{submitLabel(topic)}<Send aria-hidden="true" className="h-4 w-4 transition group-hover:translate-x-0.5" /></>}
          </button>
        </form>
      )}
    </div>
  );
}
