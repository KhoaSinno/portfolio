"use client";

import { useEffect, useState } from "react";
import { ResumePreview } from "./ResumePreview";
import { getPublishedResume } from "./resume-api";
import { defaultResume, type ResumeData } from "./resume-schema";

export function PublicResume() {
  const [resume, setResume] = useState<ResumeData>(defaultResume);
  useEffect(() => { void getPublishedResume().then((published) => setResume(published ?? defaultResume)).catch(() => setResume(defaultResume)); }, []);
  return <main className="min-h-screen bg-zinc-100 px-4 py-8 sm:px-8 sm:py-12"><div className="no-print mx-auto mb-5 flex max-w-[210mm] items-center justify-between gap-4"><a href="/admin/resume" className="text-sm font-medium text-blue-700 hover:text-blue-600">← Resume editor</a><button onClick={() => window.print()} className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700">Print / PDF</button></div><ResumePreview resume={resume} /></main>;
}
