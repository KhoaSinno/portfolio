"use client";
/* eslint-disable @next/next/no-img-element -- Markdown images may be hosted on arbitrary GitHub repositories. */

import Link from "next/link";
import { ArrowLeft, Code2, ExternalLink, LoaderCircle } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEffect, useState } from "react";

type CaseStudy = {
  title: string;
  repositoryUrl: string;
  demoUrl: string;
  markdown: string;
  baseUrl: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

function absoluteUrl(url: string, baseUrl: string) {
  try {
    const resolved = new URL(url, baseUrl);
    return ["http:", "https:", "mailto:"].includes(resolved.protocol)
      ? resolved.toString()
      : "";
  } catch {
    return "";
  }
}

function externalUrl(url: string) {
  return absoluteUrl(/^https?:\/\//i.test(url) ? url : `https://${url}`, "https://example.com");
}

export function ProjectCaseStudy({ slug }: { slug: string }) {
  const [state, setState] = useState<{ data?: CaseStudy; error?: string }>({});

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_URL}/projects/${encodeURIComponent(slug)}/case-study`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { message?: string } | null;
          throw new Error(body?.message || "Unable to load this case study.");
        }
        return response.json() as Promise<CaseStudy>;
      })
      .then((data) => setState({ data }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({ error: error instanceof Error ? error.message : "Unable to load this case study." });
      });
    return () => controller.abort();
  }, [slug]);

  if (state.error) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center px-6 py-20 text-center text-slate-200">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">Case study unavailable</p>
        <h1 className="mt-3 text-3xl font-bold text-white">This project README cannot be shown yet.</h1>
        <p className="mt-4 text-slate-400">{state.error}</p>
        <Link href="/#projects" className="mx-auto mt-8 inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 px-4 text-sm font-semibold transition hover:bg-white/10">
          <ArrowLeft className="h-4 w-4" /> Back to projects
        </Link>
      </main>
    );
  }

  if (!state.data) {
    return <main className="flex min-h-[70vh] items-center justify-center text-slate-300"><LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> Loading case study…</main>;
  }

  const { data } = state;
  return (
    <main className="min-h-screen bg-[#080b16] px-4 py-10 text-slate-200 sm:px-6">
      <article className="mx-auto max-w-4xl">
        <Link href="/#projects" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to projects
        </Link>
        <header className="mt-8 border-b border-white/10 pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">GitHub README</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-5xl">{data.title}</h1>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={data.repositoryUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 px-4 text-sm font-semibold transition hover:bg-white/10"><Code2 className="h-4 w-4" /> Source code <ExternalLink className="h-3.5 w-3.5" /></a>
            {data.demoUrl && <a href={externalUrl(data.demoUrl)} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-violet-500 px-4 text-sm font-semibold text-white transition hover:bg-violet-400">Live demo <ExternalLink className="h-3.5 w-3.5" /></a>}
          </div>
        </header>
        <div className="prose prose-invert prose-slate mt-10 max-w-none prose-headings:scroll-mt-8 prose-a:text-violet-300 hover:prose-a:text-violet-200 prose-img:rounded-xl prose-pre:border prose-pre:border-white/10">
          <Markdown remarkPlugins={[remarkGfm]} components={{
            img: ({ src, alt }) => typeof src === "string" ? <img src={absoluteUrl(src, data.baseUrl)} alt={alt || "Project documentation image"} loading="lazy" /> : null,
            a: ({ href, children }) => <a href={href ? absoluteUrl(href, data.baseUrl) || undefined : undefined} target="_blank" rel="noreferrer">{children}</a>,
          }}>{data.markdown}</Markdown>
        </div>
      </article>
    </main>
  );
}
