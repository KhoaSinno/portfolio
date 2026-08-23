"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Check,
  Clock,
  Copy,
  CopyPlus,
  ExternalLink,
  Eye,
  FileText,
  Layers,
  Loader2,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import type { ResumeProfileItem } from "./resume-api";

interface CvManagerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  resumes: ResumeProfileItem[];
  activeResumeId: string | null;
  onSelectResume: (id: string) => void;
  onCreateOrDuplicate: (dto: { title: string; slug?: string; sourceResumeId?: string }) => Promise<void>;
  onSetPrimary: (id: string) => Promise<void>;
  onDeleteResume: (id: string) => Promise<void>;
}

export function CvManagerDrawer({
  isOpen,
  onClose,
  resumes,
  activeResumeId,
  onSelectResume,
  onCreateOrDuplicate,
  onSetPrimary,
  onDeleteResume,
}: CvManagerDrawerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [sourceResumeId, setSourceResumeId] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50);
  };

  const handleTitleChange = (val: string) => {
    setNewTitle(val);
    setNewSlug(slugify(val));
  };

  const handleOpenDuplicate = (source: ResumeProfileItem) => {
    setNewTitle(`${source.title} (Copy)`);
    setNewSlug(slugify(`${source.slug || source.title}-copy`));
    setSourceResumeId(source.id);
    setShowCreateForm(true);
    setErrorNotice(null);
  };

  const handleOpenCreateBlank = () => {
    setNewTitle("");
    setNewSlug("");
    setSourceResumeId("");
    setShowCreateForm(true);
    setErrorNotice(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setErrorNotice("Please enter a CV title.");
      return;
    }
    setCreating(true);
    setErrorNotice(null);
    try {
      await onCreateOrDuplicate({
        title: newTitle.trim(),
        slug: newSlug.trim() || undefined,
        sourceResumeId: sourceResumeId || undefined,
      });
      setShowCreateForm(false);
      setNewTitle("");
      setNewSlug("");
      setSourceResumeId("");
    } catch (err) {
      setErrorNotice(err instanceof Error ? err.message : "Failed to create CV profile.");
    } finally {
      setCreating(false);
    }
  };

  const handleCopyLink = (resume: ResumeProfileItem) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = resume.isPrimary ? `${origin}/resume` : `${origin}/resume/${resume.slug || resume.id}`;
    void navigator.clipboard.writeText(url);
    setCopiedId(resume.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSetPrimaryClick = async (id: string) => {
    setActionLoadingId(id);
    setErrorNotice(null);
    try {
      await onSetPrimary(id);
    } catch (err) {
      setErrorNotice(err instanceof Error ? err.message : "Failed to set Primary CV.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteClick = async (id: string) => {
    setActionLoadingId(id);
    setErrorNotice(null);
    try {
      await onDeleteResume(id);
      setDeleteConfirmId(null);
    } catch (err) {
      setErrorNotice(err instanceof Error ? err.message : "Failed to delete CV.");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in">
      <div className="relative flex h-full w-full max-w-xl flex-col bg-zinc-900 border-l border-white/10 text-zinc-100 shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 bg-zinc-950/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white sm:text-base">
                CV Profiles & Targeted Slugs
              </h2>
              <p className="text-xs text-zinc-400">
                Manage and customize resumes tailored for specific JDs & companies.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Global Alert Notice */}
        {errorNotice && (
          <div className="mx-5 mt-3 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
            <div className="flex-1">{errorNotice}</div>
            <button
              type="button"
              onClick={() => setErrorNotice(null)}
              className="text-rose-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Action Header: Create / Clone button */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Available CVs ({resumes.length})
          </span>
          {!showCreateForm && (
            <button
              type="button"
              onClick={handleOpenCreateBlank}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 active:scale-95 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create New CV</span>
            </button>
          )}
        </div>

        {/* Create / Clone Sub-form Modal */}
        {showCreateForm && (
          <form
            onSubmit={handleCreateSubmit}
            className="mx-5 mb-3 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-4 space-y-3 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <span>{sourceResumeId ? "Duplicate CV Profile" : "Create New CV Profile"}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="text-zinc-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-300">
                CV Title / Label <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. AI & RAG Engineer — VNG or Backend Specialist"
                className="mt-1 w-full rounded-lg border border-white/15 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-300">
                Custom URL Slug <span className="text-zinc-400">(e.g. /resume/ai-engineer)</span>
              </label>
              <div className="mt-1 flex items-center rounded-lg border border-white/15 bg-zinc-950 px-2.5 py-1 text-xs text-zinc-400">
                <span className="font-mono text-[11px] text-zinc-500 select-none">/resume/</span>
                <input
                  type="text"
                  value={newSlug}
                  onChange={(e) => setNewSlug(slugify(e.target.value))}
                  placeholder="ai-engineer"
                  className="w-full bg-transparent pl-0.5 font-mono text-xs text-white placeholder-zinc-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating || !newTitle.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition"
              >
                {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                <span>{creating ? "Creating..." : "Create & Start Editing"}</span>
              </button>
            </div>
          </form>
        )}

        {/* CV Cards List */}
        <div className="flex-1 overflow-y-auto px-5 py-2 space-y-3.5">
          {resumes.map((item) => {
            const isActive = item.id === activeResumeId;
            const isDeletingThis = deleteConfirmId === item.id;
            const isLoadingThis = actionLoadingId === item.id;
            const isCopied = copiedId === item.id;
            const canDelete = !item.isPrimary && resumes.length > 1;

            return (
              <div
                key={item.id}
                className={`group relative rounded-2xl border p-4 transition-all duration-200 ${
                  isActive
                    ? "border-indigo-500/60 bg-indigo-950/20 shadow-md shadow-indigo-950/50"
                    : "border-white/10 bg-zinc-950/60 hover:border-white/20 hover:bg-zinc-950/90"
                }`}
              >
                {/* Top Row: Title + Primary Badge + Status */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">
                      {item.title}
                    </h3>
                    {item.isPrimary && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        <Star className="h-2.5 w-2.5 fill-emerald-400 text-emerald-400" />
                        <span>Primary</span>
                      </span>
                    )}
                    {isActive && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                        Active in Editor
                      </span>
                    )}
                  </div>

                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-mono font-semibold ${
                      item.status === "PUBLISHED"
                        ? "bg-blue-500/10 text-blue-300 border border-blue-500/20"
                        : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                {/* Second Row: Public URL & Copy Button */}
                <div className="mt-2.5 flex items-center justify-between rounded-xl bg-zinc-900/90 border border-white/5 px-3 py-1.5 text-xs">
                  <a
                    href={item.isPrimary ? "/resume" : `/resume/${item.slug || item.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-mono text-[11px] text-zinc-400 hover:text-indigo-300 transition truncate"
                  >
                    <ExternalLink className="h-3 w-3 shrink-0 text-zinc-500" />
                    <span className="truncate">
                      {item.isPrimary ? "/resume" : `/resume/${item.slug || item.id}`}
                    </span>
                  </a>

                  <button
                    type="button"
                    onClick={() => handleCopyLink(item)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-white transition shrink-0 ml-2"
                    title="Copy full public URL"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Third Row: Analytics Metrics */}
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-400 font-mono">
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3 w-3 text-indigo-400" />
                    <span>{item.viewsCount} views</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Layers className="h-3 w-3 text-zinc-500" />
                    <span>{item._count?.versions ?? 1} versions</span>
                  </span>
                  {item.lastViewedAt && (
                    <span className="inline-flex items-center gap-1 text-zinc-500">
                      <Clock className="h-3 w-3" />
                      <span>Last viewed {new Date(item.lastViewedAt).toLocaleDateString()}</span>
                    </span>
                  )}
                </div>

                {/* Delete Confirmation Box */}
                {isDeletingThis ? (
                  <div className="mt-3.5 rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs space-y-2 animate-in fade-in">
                    <div className="flex items-center gap-2 text-rose-300 font-semibold">
                      <AlertTriangle className="h-4 w-4 text-rose-400" />
                      <span>Confirm delete &quot;{item.title}&quot;?</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      This will permanently remove this CV and its version history.
                    </p>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(null)}
                        className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-zinc-300 hover:bg-white/5"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isLoadingThis}
                        onClick={() => handleDeleteClick(item.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-50"
                      >
                        {isLoadingThis && <Loader2 className="h-3 w-3 animate-spin" />}
                        <span>Delete Permanently</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Action Buttons Bar */
                  <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
                    <div className="flex items-center gap-1.5">
                      {!isActive && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectResume(item.id);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:border-white/20 hover:bg-white/10 hover:text-white transition"
                        >
                          <span>Edit on Canvas</span>
                        </button>
                      )}

                      {!item.isPrimary && (
                        <button
                          type="button"
                          disabled={isLoadingThis}
                          onClick={() => handleSetPrimaryClick(item.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300 hover:border-emerald-500/50 hover:bg-emerald-500/20 transition disabled:opacity-50"
                          title="Set this CV as the Primary for /resume and Portfolio homepage"
                        >
                          <Star className="h-3 w-3" />
                          <span>Set as Primary</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenDuplicate(item)}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:border-white/20 hover:bg-white/10 hover:text-white transition"
                        title="Duplicate this CV profile"
                      >
                        <CopyPlus className="h-3 w-3 text-indigo-400" />
                        <span>Duplicate</span>
                      </button>

                      {/* Delete Button with Constraints Tooltips */}
                      {canDelete ? (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-500/20 bg-rose-500/5 p-1.5 text-xs text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/15 transition"
                          title="Delete this secondary CV"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="inline-flex items-center gap-1 rounded-lg border border-white/5 bg-zinc-900 p-1.5 text-xs text-zinc-600 cursor-not-allowed opacity-40"
                          title={
                            item.isPrimary
                              ? "Primary CV cannot be deleted. Set another CV as Primary first."
                              : "Cannot delete the only remaining CV in the system."
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Drawer Footer info */}
        <div className="border-t border-white/10 px-5 py-3 bg-zinc-950/80 text-[11px] text-zinc-500 flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Primary Protection & Auto Slug Generation Enabled</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
