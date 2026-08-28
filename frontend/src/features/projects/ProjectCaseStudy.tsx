"use client";
/* eslint-disable @next/next/no-img-element -- Markdown and HTML images are hosted on arbitrary GitHub repositories. */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Code2, Copy, ExternalLink, FileText, Globe, LoaderCircle, Play, Sparkles } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import { useEffect, useState } from "react";
import { isVideoUrl, normalizeImageUrl, parseRepositories } from "@/lib/image-url";
import { MermaidRenderer } from "@/features/projects/MermaidRenderer";

type RepositoryItem = {
  label: string;
  url: string;
  index: number;
  isActive: boolean;
};

type CaseStudy = {
  title: string;
  repositoryUrl: string;
  repositories?: RepositoryItem[];
  selectedRepoIndex?: number;
  selectedRepoLabel?: string;
  demoUrl: string;
  markdown: string;
  baseUrl: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

function GithubIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function absoluteUrl(url: string, baseUrl: string) {
  if (!url) return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("mailto:") || trimmed.startsWith("data:")) {
    return normalizeImageUrl(trimmed);
  }
  try {
    const resolved = new URL(trimmed, baseUrl);
    return normalizeImageUrl(resolved.toString());
  } catch {
    const cleanBase = baseUrl.replace(/\/+$/, "");
    const cleanPath = trimmed.replace(/^\.?\/+/, "");
    return `${cleanBase}/${cleanPath}`;
  }
}

function externalUrl(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

/**
 * Preprocess markdown to rewrite relative images and links in both Markdown and raw HTML tags.
 */
function preprocessMarkdown(markdown: string, baseUrl: string): string {
  if (!markdown) return "";

  // 1. Rewrite markdown relative images: ![alt](relative/path)
  let result = markdown.replace(
    /!\[([^\]]*)\]\((?!https?:\/\/|data:|\/)([^)]+)\)/g,
    (match, alt, relPath) => {
      const abs = absoluteUrl(relPath, baseUrl);
      return `![${alt}](${abs})`;
    }
  );

  // 2. Rewrite raw HTML <img ... src="relative/path" ...>
  result = result.replace(
    /<img\s+([^>]*?)src=["'](?!https?:\/\/|data:|\/)([^"']+)["']([^>]*?)>/gi,
    (match, before, relPath, after) => {
      const abs = absoluteUrl(relPath, baseUrl);
      return `<img ${before}src="${abs}"${after}>`;
    }
  );

  // 3. Rewrite raw HTML <a ... href="relative/path" ...>
  result = result.replace(
    /<a\s+([^>]*?)href=["'](?!https?:\/\/|mailto:|#|\/)([^"']+)["']([^>]*?)>/gi,
    (match, before, relPath, after) => {
      const abs = absoluteUrl(relPath, baseUrl);
      return `<a ${before}href="${abs}" target="_blank" rel="noreferrer"${after}>`;
    }
  );

  return result;
}

export function ProjectCaseStudy({ slug }: { slug: string }) {
  const router = useRouter();
  const [state, setState] = useState<{ data?: CaseStudy; error?: string }>({});
  const [activeRepoIndex, setActiveRepoIndex] = useState<number>(0);
  const [repoCache, setRepoCache] = useState<Record<number, CaseStudy>>({});
  const [isSwitching, setIsSwitching] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleBack = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/#projects");
    }
  };

  const fetchRepoData = (repoIdx: number) => {
    if (repoCache[repoIdx]) {
      setState({ data: repoCache[repoIdx] });
      setActiveRepoIndex(repoIdx);
      return;
    }

    setIsSwitching(true);
    fetch(`${API_URL}/projects/${encodeURIComponent(slug)}/case-study?repo=${repoIdx}`)
      .then(async (response) => {
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { message?: string } | null;
          throw new Error(body?.message || "Unable to load this case study.");
        }
        return response.json() as Promise<CaseStudy>;
      })
      .then((data) => {
        setRepoCache((prev) => ({ ...prev, [repoIdx]: data }));
        setState({ data });
        setActiveRepoIndex(repoIdx);
      })
      .catch((error: unknown) => {
        setState({ error: error instanceof Error ? error.message : "Unable to load this case study." });
      })
      .finally(() => {
        setIsSwitching(false);
      });
  };

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
      .then((data) => {
        const initialIndex = data.selectedRepoIndex ?? 0;
        setRepoCache({ [initialIndex]: data });
        setActiveRepoIndex(initialIndex);
        setState({ data });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({ error: error instanceof Error ? error.message : "Unable to load this case study." });
      });
    return () => controller.abort();
  }, [slug]);

  const copyRepoUrl = () => {
    if (!state.data?.repositoryUrl) return;
    void navigator.clipboard.writeText(state.data.repositoryUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (state.error) {
    return (
      <main className="mx-auto flex min-h-[75vh] max-w-3xl flex-col justify-center px-6 py-20 text-center text-slate-200">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
          <FileText className="h-6 w-6" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">Case study unavailable</p>
        <h1 className="mt-3 text-3xl font-bold text-white">This project README cannot be displayed.</h1>
        <p className="mt-4 text-sm text-slate-400 max-w-md mx-auto">{state.error}</p>
        <button
          type="button"
          onClick={handleBack}
          className="mx-auto mt-8 inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 text-sm font-semibold text-white transition hover:bg-white/10 active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to projects
        </button>
      </main>
    );
  }

  if (!state.data) {
    return (
      <main className="flex min-h-[75vh] flex-col items-center justify-center text-slate-300 gap-3">
        <LoaderCircle className="h-8 w-8 animate-spin text-violet-400" />
        <p className="text-sm font-medium text-slate-400">Fetching and rendering GitHub README...</p>
      </main>
    );
  }

  const { data } = state;
  const processedMarkdown = preprocessMarkdown(data.markdown, data.baseUrl);
  const repositories = data.repositories || [];
  const hasMultipleRepos = repositories.length > 1;

  return (
    <main className="min-h-screen bg-[#060913] px-4 py-8 text-slate-200 sm:px-8 lg:px-12 md:py-12">
      {/* Background ambient lighting */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[10%] left-[25%] h-[500px] w-[500px] rounded-full bg-indigo-600/15 blur-[140px]" />
        <div className="absolute top-[40%] right-[10%] h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[150px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between gap-4 pb-6">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-slate-300 backdrop-blur-md transition hover:border-white/20 hover:bg-white/10 hover:text-white active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to projects
          </button>

          <button
            type="button"
            onClick={copyRepoUrl}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-slate-200 transition cursor-pointer"
            title="Copy Repository URL"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied URL!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Share Repo</span>
              </>
            )}
          </button>
        </div>

        {/* Hero Header Card */}
        <header className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/15 border border-violet-500/30 px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider text-violet-300">
              <Sparkles className="h-3 w-3" />
              GitHub Case Study
            </div>

            {hasMultipleRepos && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-0.5 font-mono text-[11px] font-medium text-indigo-300">
                <Code2 className="h-3.5 w-3.5" />
                <span>{repositories.length} Modular Repositories</span>
              </span>
            )}
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
            {data.title}
          </h1>

          {/* Multi-Repo Switcher Tabs (If project has multiple repos) */}
          {hasMultipleRepos && (
            <div className="mt-6 pt-5 border-t border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  Select Module Case Study:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {repositories.map((repo, idx) => {
                    const isCurrent = activeRepoIndex === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => fetchRepoData(idx)}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 cursor-pointer ${
                          isCurrent
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400 scale-105"
                            : "bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10"
                        }`}
                      >
                        <GithubIcon className="h-3.5 w-3.5" />
                        <span>{repo.label}</span>
                        {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* CTAs / Quick Links */}
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/10 pt-6">
            {data.repositoryUrl && (
              <a
                href={data.repositoryUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-xs font-semibold text-slate-200 backdrop-blur-md transition hover:border-white/30 hover:bg-white/10 hover:text-white active:scale-95"
                title="View on GitHub"
              >
                <Code2 className="h-4 w-4 text-violet-400" />
                <span>
                  {data.selectedRepoLabel ? `Source Code (${data.selectedRepoLabel})` : "Source Code"}
                </span>
                <ExternalLink className="h-3 w-3 text-slate-400" />
              </a>
            )}

            {data.demoUrl && (() => {
              const isVideo = isVideoUrl(data.demoUrl);
              return isVideo ? (
                <a
                  href={externalUrl(data.demoUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-4 text-xs font-bold text-white shadow-lg shadow-rose-600/25 transition hover:from-rose-500 hover:to-red-500 active:scale-95"
                >
                  <Play className="h-3.5 w-3.5 fill-white" />
                  <span>Watch Demo Video</span>
                  <ExternalLink className="h-3 w-3 text-white/80" />
                </a>
              ) : (
                <a
                  href={externalUrl(data.demoUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 text-xs font-bold text-white shadow-lg shadow-violet-600/20 transition hover:from-violet-500 hover:to-indigo-500 active:scale-95"
                >
                  <Globe className="h-4 w-4" />
                  <span>Live Demo</span>
                  <ExternalLink className="h-3 w-3 text-white/80" />
                </a>
              );
            })()}
          </div>
        </header>

        {/* GitHub README Markdown Container (Rendered like GitHub Dark) */}
        {isSwitching ? (
          <div className="mt-8 flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#0d1117]/95 p-12 text-slate-300 gap-3 shadow-2xl backdrop-blur-md">
            <LoaderCircle className="h-7 w-7 animate-spin text-indigo-400" />
            <p className="text-xs font-medium text-slate-400">Loading module case study...</p>
          </div>
        ) : (
        <article className="mt-8 rounded-2xl border border-white/10 bg-[#0d1117]/95 p-6 sm:p-10 shadow-2xl backdrop-blur-md">
          <div className="case-study-content text-slate-300 leading-relaxed space-y-4">
            <Markdown
              remarkPlugins={[remarkGfm, remarkFrontmatter]}
              rehypePlugins={[rehypeRaw, rehypeHighlight]}
              components={{
                img: ({ src, alt, width, height, ...props }) => {
                  const srcString = typeof src === "string" ? src : "";
                  const resolvedSrc = srcString ? absoluteUrl(srcString, data.baseUrl) : "";
                  return (
                    <span className="my-4 block text-center">
                      <img
                        src={resolvedSrc}
                        alt={alt || "Project figure"}
                        width={width}
                        height={height}
                        loading="lazy"
                        className="inline-block max-w-full rounded-xl border border-white/10 shadow-lg object-contain"
                        {...props}
                      />
                    </span>
                  );
                },
                a: ({ href, children, ...props }) => {
                  const hrefString = typeof href === "string" ? href : "";
                  const resolvedHref = hrefString ? absoluteUrl(hrefString, data.baseUrl) : undefined;
                  return (
                    <a
                      href={resolvedHref}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-violet-400 underline decoration-violet-500/40 underline-offset-4 hover:text-violet-300 hover:decoration-violet-400 transition"
                      {...props}
                    >
                      {children}
                    </a>
                  );
                },
                h1: ({ children, ...props }) => (
                  <h1 className="mt-8 mb-4 border-b border-white/10 pb-3 text-2xl sm:text-3xl font-bold text-white tracking-tight" {...props}>
                    {children}
                  </h1>
                ),
                h2: ({ children, ...props }) => (
                  <h2 className="mt-7 mb-3 border-b border-white/10 pb-2 text-xl sm:text-2xl font-bold text-slate-100 tracking-tight" {...props}>
                    {children}
                  </h2>
                ),
                h3: ({ children, ...props }) => (
                  <h3 className="mt-6 mb-2 text-lg sm:text-xl font-bold text-slate-200" {...props}>
                    {children}
                  </h3>
                ),
                p: ({ children, ...props }) => (
                  <p className="my-3 leading-relaxed text-slate-300 text-sm sm:text-base" {...props}>
                    {children}
                  </p>
                ),
                ul: ({ children, ...props }) => (
                  <ul className="my-3 list-disc list-outside pl-6 space-y-1.5 text-sm sm:text-base text-slate-300" {...props}>
                    {children}
                  </ul>
                ),
                ol: ({ children, ...props }) => (
                  <ol className="my-3 list-decimal list-outside pl-6 space-y-1.5 text-sm sm:text-base text-slate-300" {...props}>
                    {children}
                  </ol>
                ),
                li: ({ children, ...props }) => (
                  <li className="leading-relaxed" {...props}>
                    {children}
                  </li>
                ),
                blockquote: ({ children, ...props }) => (
                  <blockquote className="my-4 border-l-4 border-violet-500/60 bg-violet-500/5 py-2 px-4 rounded-r-xl text-slate-300 italic text-sm" {...props}>
                    {children}
                  </blockquote>
                ),
                table: ({ children, ...props }) => (
                  <div className="my-6 overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full text-left text-xs sm:text-sm border-collapse" {...props}>
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children, ...props }) => (
                  <thead className="bg-white/5 border-b border-white/10 text-white font-semibold" {...props}>
                    {children}
                  </thead>
                ),
                tbody: ({ children, ...props }) => (
                  <tbody className="divide-y divide-white/5" {...props}>
                    {children}
                  </tbody>
                ),
                tr: ({ children, ...props }) => (
                  <tr className="hover:bg-white/[0.02] transition" {...props}>
                    {children}
                  </tr>
                ),
                th: ({ children, ...props }) => (
                  <th className="px-4 py-3 font-bold text-slate-100" {...props}>
                    {children}
                  </th>
                ),
                td: ({ children, ...props }) => (
                  <td className="px-4 py-3 text-slate-300 align-top" {...props}>
                    {children}
                  </td>
                ),
                code: ({ className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || "");
                  const language = match ? match[1] : "";
                  const codeContent = String(children).replace(/\n$/, "");

                  if (language === "mermaid") {
                    return <MermaidRenderer chart={codeContent} />;
                  }

                  const isInline = !className;
                  if (isInline) {
                    return (
                      <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs text-violet-200 border border-white/5" {...props}>
                        {children}
                      </code>
                    );
                  }
                  return (
                    <code className={`${className || ""} font-mono text-xs`} {...props}>
                      {children}
                    </code>
                  );
                },
                pre: ({ children, ...props }) => {
                  const isMermaid = (children as any)?.props?.className?.includes("language-mermaid");
                  if (isMermaid) {
                    return <>{children}</>;
                  }
                  return (
                    <pre className="my-4 overflow-x-auto rounded-xl border border-white/10 bg-[#060913] p-4 font-mono text-xs text-slate-200 shadow-inner" {...props}>
                      {children}
                    </pre>
                  );
                },
                hr: ({ ...props }) => <hr className="my-8 border-white/10" {...props} />,
              }}
            >
              {processedMarkdown}
            </Markdown>
          </div>
        </article>
        )}

        {/* Bottom Back Button */}
        <div className="mt-8 text-center pb-12">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 text-sm font-semibold text-white transition hover:bg-white/10 active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Back to all projects
          </button>
        </div>
      </div>
    </main>
  );
}
