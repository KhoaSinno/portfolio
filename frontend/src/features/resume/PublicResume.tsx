"use client";

import { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { toPng } from "html-to-image";
import {
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  Lock,
  Printer,
  Sparkles,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { ResumePreview } from "./ResumePreview";
import { getPublishedResume } from "./resume-api";
import { defaultResume, type ResumeData } from "./resume-schema";

export function PublicResume({ slug }: { slug?: string }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [resume, setResume] = useState<ResumeData>(defaultResume);
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [exportingImage, setExportingImage] = useState(false);

  const printResume = useReactToPrint({
    contentRef,
    documentTitle: `${(resume.basics.name || "Resume").replace(/\s+/g, "_")}_CV`,
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 0mm !important;
      }
      @media print {
        *, *::before, *::after {
          box-sizing: border-box !important;
        }
        html, body {
          margin: 0mm !important;
          padding: 0mm !important;
          background: #ffffff !important;
          color: #000000 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .no-print {
          display: none !important;
        }
        .resume-paper {
          width: 210mm !important;
          min-height: 297mm !important;
          max-width: none !important;
          margin: 0 auto !important;
          padding: 12mm 14mm !important;
          box-shadow: none !important;
          border: none !important;
          border-radius: 0 !important;
          background: #ffffff !important;
        }
        .page-break-line {
          display: none !important;
        }
        a {
          text-decoration: none !important;
          color: inherit !important;
        }
      }
    `,
  });

  const exportAsImage = async () => {
    if (!contentRef.current) return;
    try {
      setExportingImage(true);
      const dataUrl = await toPng(contentRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `${(resume.basics.name || "Resume").replace(/\s+/g, "_")}_CV.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export image:", err);
    } finally {
      setExportingImage(false);
    }
  };

  useEffect(() => {
    void getPublishedResume(slug)
      .then((published) => {
        if (published) setResume(published);
      })
      .catch(() => {
        setResume(defaultResume);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      {/* Top Floating / Sticky Toolbar */}
      <header className="no-print sticky top-0 z-30 border-b border-zinc-200/80 bg-white/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-3 py-2 sm:px-5">
          <div className="flex items-center gap-2.5">
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white p-1 pl-2.5 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 transition"
              title="Return to Portfolio"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-zinc-500" />
              <div className="flex items-center rounded-lg bg-[#090d16] px-2 py-1">
                <img src="/logo.png" alt="Sinoo Hub" className="h-4 w-auto object-contain" />
              </div>
            </a>
            <div className="hidden sm:flex sm:items-center sm:gap-2">
              <span className="text-xs text-zinc-400">/</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-800">
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

            {/* Export PNG Image Button */}
            <button
              type="button"
              disabled={exportingImage}
              onClick={() => void exportAsImage()}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-50 active:scale-95 transition disabled:opacity-50"
              title="Download high-resolution PNG image"
            >
              <ImageIcon className="h-3.5 w-3.5 text-zinc-500" />
              <span>{exportingImage ? "Exporting..." : "Export PNG"}</span>
            </button>

            {/* Print / Download Button */}
            <button
              type="button"
              onClick={() => printResume()}
              className="inline-flex items-center gap-1.5 rounded-md bg-zinc-950 px-3 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-zinc-800 transition active:scale-95"
              title="Print or Save Clean A4 PDF"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / PDF</span>
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
