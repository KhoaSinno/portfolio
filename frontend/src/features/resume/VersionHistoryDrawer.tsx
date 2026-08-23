"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import {
  Clock,
  History,
  RotateCcw,
  X,
  CheckCircle2,
  Calendar,
  Layers,
  Briefcase,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { getResumeVersions, type ResumeVersionItem } from "./resume-api";

interface VersionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onRollback: (version: ResumeVersionItem) => Promise<void>;
  resumeId?: string;
  resumeTitle?: string;
}

export function VersionHistoryDrawer({
  isOpen,
  onClose,
  onRollback,
  resumeId,
  resumeTitle,
}: VersionHistoryDrawerProps) {
  const [versions, setVersions] = useState<ResumeVersionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [confirmVersion, setConfirmVersion] = useState<ResumeVersionItem | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      getResumeVersions(resumeId)
        .then((data) => {
          setVersions(data);
          if (data.length > 0) {
            setExpandedId(data[0].id);
          }
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Failed to load versions.");
        })
        .finally(() => setLoading(false));
    } else {
      setConfirmVersion(null);
      setRestoringId(null);
    }
  }, [isOpen, resumeId]);

  if (!isOpen) return null;

  const handleConfirmRestore = async (version: ResumeVersionItem) => {
    try {
      setRestoringId(version.id);
      await onRollback(version);
      setConfirmVersion(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restore version.");
    } finally {
      setRestoringId(null);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <aside className="w-screen max-w-md bg-white shadow-2xl border-l border-zinc-200 flex flex-col animate-in slide-in-from-right duration-300">
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                <History className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-zinc-900 sm:text-base">
                  Version History
                </h2>
                <p className="text-xs text-zinc-500">
                  {versions.length} published snapshot{versions.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-200/70 hover:text-zinc-700 transition"
              title="Close drawer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {loading && (
              <div className="py-16 text-center space-y-3">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mx-auto" />
                <p className="text-xs text-zinc-500 font-medium">
                  Loading snapshot history...
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {error}
              </div>
            )}

            {!loading && !error && versions.length === 0 && (
              <div className="py-16 text-center space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 mx-auto text-zinc-400">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-900">
                  No snapshot history yet
                </h3>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                  Every time you click &quot;Publish&quot; in the editor, a permanent snapshot version will be recorded here.
                </p>
              </div>
            )}

            {!loading &&
              versions.map((ver, idx) => {
                const isLatest = idx === 0;
                const isExpanded = expandedId === ver.id;
                const isConfirming = confirmVersion?.id === ver.id;
                const isRestoring = restoringId === ver.id;

                return (
                  <div
                    key={ver.id}
                    className={`rounded-2xl border transition-all duration-200 ${
                      isLatest
                        ? "border-indigo-200 bg-indigo-50/30 shadow-xs"
                        : "border-zinc-200 bg-white hover:border-zinc-300"
                    }`}
                  >
                    {/* Card Header */}
                    <div className="p-3.5 sm:p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center rounded-md bg-zinc-900 px-2 py-0.5 font-mono text-xs font-bold text-white shadow-2xs">
                            v{ver.version}
                          </span>
                          {isLatest && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              Latest Live
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-500">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(ver.createdAt)}</span>
                        </div>
                      </div>

                      {/* Snapshot Highlights */}
                      <div className="mt-2.5 text-xs text-zinc-700">
                        <p className="font-semibold text-zinc-900">
                          {ver.content.basics.name}
                        </p>
                        <p className="text-zinc-500 line-clamp-1 mt-0.5">
                          {ver.content.basics.headline}
                        </p>
                      </div>

                      {/* Counts / Tags */}
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-zinc-500">
                        <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5">
                          <Briefcase className="h-3 w-3 text-zinc-400" />
                          {ver.content.projects.length} project{ver.content.projects.length === 1 ? "" : "s"}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5">
                          <Layers className="h-3 w-3 text-zinc-400" />
                          {ver.content.technicalSkills.length} skill categories
                        </span>
                      </div>

                      {/* Action Bar */}
                      <div className="mt-3.5 pt-3 border-t border-zinc-100 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : ver.id)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-900 transition"
                        >
                          <span>{isExpanded ? "Hide Details" : "View Details"}</span>
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </button>

                        {isLatest ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Current Live</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={isRestoring}
                            onClick={() => setConfirmVersion(ver)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-white shadow-2xs transition hover:bg-zinc-800 active:scale-95 disabled:opacity-50"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>Rollback</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expanded Snapshot Content Details */}
                    {isExpanded && (
                      <div className="border-t border-zinc-200/80 bg-zinc-50/70 p-3.5 text-xs space-y-2.5 animate-in fade-in duration-150">
                        <div>
                          <p className="font-semibold text-zinc-800">Projects in this snapshot:</p>
                          <ul className="mt-1 list-disc list-inside text-zinc-600 space-y-0.5">
                            {ver.content.projects.map((p, pIdx) => (
                              <li key={pIdx}>
                                <strong>{p.name}</strong> {p.role ? `(${p.role})` : ""}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <p className="font-semibold text-zinc-800">Skills categories:</p>
                          <p className="mt-0.5 text-zinc-600">
                            {ver.content.technicalSkills.map((s) => s.category).join(", ")}
                          </p>
                        </div>

                        <div>
                          <p className="font-semibold text-zinc-800">Education:</p>
                          <p className="mt-0.5 text-zinc-600">
                            {ver.content.education.map((e) => `${e.institution} (${e.degree})`).join(" · ")}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Confirmation Modal inline inside card */}
                    {isConfirming && (
                      <div className="border-t border-amber-200 bg-amber-50 p-3.5 animate-in fade-in duration-150">
                        <div className="flex items-start gap-2 text-amber-900 text-xs">
                          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold">Restore snapshot v{ver.version}?</p>
                            <p className="mt-0.5 text-amber-800">
                              This will overwrite your current draft in the editor with this version&apos;s data. You can still make changes and re-publish anytime.
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setConfirmVersion(null)}
                            className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={isRestoring}
                            onClick={() => void handleConfirmRestore(ver)}
                            className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1 text-xs font-bold text-white shadow-2xs hover:bg-amber-700 disabled:opacity-50"
                          >
                            {isRestoring ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>Restoring...</span>
                              </>
                            ) : (
                              <>
                                <RotateCcw className="h-3 w-3" />
                                <span>Confirm Restore</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-zinc-200 bg-zinc-50 text-xs text-zinc-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              <span>Safe Rollbacks Enabled</span>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="font-medium text-zinc-700 hover:text-zinc-900 transition"
            >
              Done
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
