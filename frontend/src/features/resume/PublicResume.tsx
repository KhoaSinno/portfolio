"use client";

import { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import {
  ArrowLeft,
  FileText,
  Lock,
  Printer,
  Sparkles,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { ResumePreview } from "./ResumePreview";
import { getPublishedResume } from "./resume-api";
import { defaultResume, type ResumeData } from "./resume-schema";

export function PublicResume() {
  const contentRef = useRef<HTMLDivElement>(null);
  const [resume, setResume] = useState<ResumeData>(defaultResume);
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);

  const printResume = useReactToPrint({ contentRef, documentTitle: `${resume.basics.name.replace(/\s+/g, "_")}_Resume` });

  useEffect(() => {
    void getPublishedResume()
      .then((published) => {
        if (published) setResume(published);
      })
      .catch(() => {
        setResume(defaultResume);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      {/* Top Floating / Sticky Toolbar */}
      <header className="no-print sticky top-0 z-30 border-b border-zinc-200/80 bg-white/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-3 py-2 sm:px-5">
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Portfolio</span>
            </a>
            <div className="hidden sm:flex sm:items-center sm:gap-2">
              <span className="text-xs text-zinc-400">/</span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-800">
                <FileText className="h-3.5 w-3.5 text-blue-600" />
                {resume.basics.name}&apos;s CV
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="hidden items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50/80 px-2 py-0.5 md:flex">
              <button
                type="button"
                disabled={zoomLevel <= 70}
                onClick={() => setZoomLevel((prev) => Math.max(70, prev - 10))}
                className="rounded p-1 text-zinc-500 hover:bg-zinc-200 disabled:opacity-30"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-[42px] text-center font-mono text-xs font-medium text-zinc-700">
                {zoomLevel}%
              </span>
              <button
                type="button"
                disabled={zoomLevel >= 130}
                onClick={() => setZoomLevel((prev) => Math.min(130, prev + 10))}
                className="rounded p-1 text-zinc-500 hover:bg-zinc-200 disabled:opacity-30"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(100)}
                className="ml-1 text-[11px] font-semibold text-zinc-500 hover:text-zinc-900"
              >
                Reset
              </button>
            </div>

            {/* Admin link */}
            <a
              href="/admin/resume"
              className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 shadow-2xs hover:bg-zinc-50"
              title="Admin Resume Editor"
            >
              <Lock className="h-3 w-3 text-zinc-400" />
              <span className="hidden sm:inline">Editor</span>
            </a>

            {/* Print / Download Button */}
            <button
              type="button"
              onClick={() => printResume()}
              className="inline-flex items-center gap-1.5 rounded-md bg-zinc-950 px-3 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-zinc-800"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / Download PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Canvas */}
      <main className="mx-auto flex justify-center px-2 py-3 sm:px-4 sm:py-5">
        <div
          className="transition-transform duration-150 origin-top"
          style={{ transform: `scale(${zoomLevel / 100})` }}
        >
          {loading ? (
            <div className="flex h-[297mm] w-full max-w-[210mm] items-center justify-center rounded bg-white p-12 shadow-xl ring-1 ring-black/5">
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Sparkles className="h-4 w-4 animate-spin text-blue-600" />
                <span>Loading CV document...</span>
              </div>
            </div>
          ) : (
            <ResumePreview resume={resume} contentRef={contentRef} />
          )}
        </div>
      </main>
    </div>
  );
}
