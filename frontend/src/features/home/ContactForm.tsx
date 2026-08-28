"use client";

import { useRef, useState } from "react";
import {
  Send,
  Mail,
  Link2,
  UploadCloud,
  FileText,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api/client";

interface ToastState {
  show: boolean;
  message: string;
  type: "success" | "error";
}

export function ContactForm() {
  const [email, setEmail] = useState("");
  const [jdMode, setJdMode] = useState<"file" | "link">("file");
  const [jdLink, setJdLink] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 6000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 15 * 1024 * 1024) {
        setErrorMessage("File is too large (max 15MB).");
        return;
      }
      setSelectedFile(file);
      setErrorMessage(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.size > 15 * 1024 * 1024) {
        setErrorMessage("File is too large (max 15MB).");
        return;
      }
      setSelectedFile(file);
      setErrorMessage(null);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage("Please enter your work email.");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("email", email.trim());

      if (selectedFile) {
        formData.append("file", selectedFile);
      }
      if (jdLink.trim()) {
        formData.append("jdLink", jdLink.trim());
      }
      if (message.trim()) {
        formData.append("message", message.trim());
      }
      if (honeypot.trim()) {
        formData.append("honeypot", honeypot.trim());
      }

      const response = await fetch(`${API_BASE_URL}/contact`, {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        success?: boolean;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data.message || `Request failed (${response.status})`);
      }

      setSubmitted(true);
      showToast(
        data.message || "Message & JD received! I'll get back to you soon.",
        "success",
      );
      // Clear state
      setEmail("");
      setJdLink("");
      setSelectedFile(null);
      setMessage("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to send message. Please try again or copy email directly.";
      setErrorMessage(msg);
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Toast Notification Container */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div
            className={`flex items-start gap-3 rounded-2xl p-4 shadow-2xl backdrop-blur-xl border ${
              toast.type === "success"
                ? "bg-slate-900/95 border-emerald-500/40 text-slate-100 shadow-emerald-950/50"
                : "bg-slate-900/95 border-rose-500/40 text-slate-100 shadow-rose-950/50"
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                toast.type === "success"
                  ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30"
                  : "bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/30"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
            </div>

            <div className="flex-1 pr-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
                {toast.type === "success"
                  ? "Sent Successfully"
                  : "Submission Notice"}
              </p>
              <p className="mt-0.5 text-xs text-slate-200 leading-relaxed font-medium">
                {toast.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setToast((prev) => ({ ...prev, show: false }))}
              className="text-slate-400 hover:text-white transition p-0.5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Form Card */}
      <div className="relative rounded-3xl border border-white/10 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/40">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Direct Message & JD Drop</span>
          </div>
          <h3 className="mt-3 text-lg font-bold text-white sm:text-xl">
            Let&apos;s talk opportunities
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Send your JD document or note directly to my inbox — no email client
            needed.
          </p>
        </div>

        {submitted ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center space-y-4 animate-in fade-in duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40 mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                Message & JD Received!
              </h4>
              <p className="mt-1 text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
                Thank you for reaching out. I have received your submission and
                will review it promptly.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition active:scale-95"
            >
              <span>Send another message</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Honeypot field (hidden from real users) */}
            <input
              type="text"
              name="website"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
            />

            {/* 1. Work Email (Required) */}
            <div>
              <label className="block text-xs font-medium text-slate-300">
                Work Email <span className="text-rose-400">*</span>
              </label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hr@company.com or your email"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/60 py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-500 transition focus:border-indigo-500 focus:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* 2. Job Description (JD) File Upload or Link */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-300">
                  Job Description (JD){" "}
                  <span className="text-slate-400 text-[11px]">(Optional)</span>
                </label>
                <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-white/10 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setJdMode("file")}
                    className={`px-2 py-0.5 rounded-md transition font-medium ${
                      jdMode === "file"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setJdMode("link")}
                    className={`px-2 py-0.5 rounded-md transition font-medium ${
                      jdMode === "link"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Paste Link
                  </button>
                </div>
              </div>

              {jdMode === "file" ? (
                <div className="mt-1.5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                    className="hidden"
                    id="jd-file-input"
                  />

                  {selectedFile ? (
                    <div className="flex items-center justify-between rounded-xl border border-indigo-500/40 bg-indigo-500/10 p-3 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate text-xs">
                            {selectedFile.name}
                          </p>
                          <p className="text-[11px] text-indigo-300">
                            {formatFileSize(selectedFile.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition"
                        title="Remove file"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-slate-950/40 p-4 text-center transition hover:border-indigo-500/60 hover:bg-slate-950/70"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-slate-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition">
                        <UploadCloud className="h-4 w-4" />
                      </div>
                      <p className="mt-2 text-xs font-semibold text-slate-200">
                        Click or drag JD file here
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        PDF, DOCX, DOC or Image (Max 15MB)
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative mt-1.5">
                  <Link2 className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={jdLink}
                    onChange={(e) => setJdLink(e.target.value)}
                    placeholder="Paste Notion, Google Docs, LinkedIn Job, or PDF URL"
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-500 transition focus:border-indigo-500 focus:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-[11px]"
                  />
                </div>
              )}
            </div>

            {/* 3. Message / Note (Optional) */}
            <div>
              <label className="block text-xs font-medium text-slate-300">
                Message / Note{" "}
                <span className="text-slate-400 text-[11px]">(Optional)</span>
              </label>
              <div className="relative mt-1.5">
                <MessageSquare className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Brief note about the role, team, or interview timeline..."
                  className="w-full rounded-xl border border-white/10 bg-slate-950/60 py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-500 transition focus:border-indigo-500 focus:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition duration-200 hover:opacity-95 hover:shadow-indigo-500/40 active:scale-[0.99] disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sending Message & JD...</span>
                </>
              ) : (
                <>
                  <span>Send Message & JD</span>
                  <Send className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
