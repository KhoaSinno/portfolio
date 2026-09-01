import { API_BASE_URL } from "@/lib/api/client";
import { parseResumeContent } from "./resume-content";
import type { ResumeData } from "./resume-schema";
import {
  getPublicResumeSnapshot,
  PUBLIC_RESUME_CACHE_TAG,
} from "./public-resume-snapshot";

const PUBLIC_RESUME_REVALIDATE_SECONDS = 300;
// Static generation must never wait for a cold backend longer than Vercel's
// page-generation budget. Callers already render a validated local fallback.
const PUBLIC_RESUME_REQUEST_TIMEOUT_MS = 8_000;

type PublicResumeResponse = {
  content: unknown;
} | null;

/**
 * Server-only public data source. ISR avoids an API/DB request for each
 * portfolio visit while keeping published resume updates fresh within 5 min.
 */
export async function getPublishedResume(
  slug?: string,
): Promise<ResumeData | null> {
  const url = slug
    ? `${API_BASE_URL}/resume/${encodeURIComponent(slug)}`
    : `${API_BASE_URL}/resume`;
  const response = await fetch(url, {
    signal: AbortSignal.timeout(PUBLIC_RESUME_REQUEST_TIMEOUT_MS),
    next: {
      revalidate: PUBLIC_RESUME_REVALIDATE_SECONDS,
      tags: slug ? [`resume:${slug}`] : [PUBLIC_RESUME_CACHE_TAG],
    },
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Failed to load published resume (${response.status}).`);
  }

  return parseResumeContent((await response.json()) as PublicResumeResponse);
}

export type PrimaryPublicResumeResult =
  | { state: "fresh"; resume: ResumeData }
  | { state: "snapshot"; resume: ResumeData; savedAt: string }
  | { state: "unavailable" };

/**
 * The public home page never falls back to sample data. The publish callback
 * owns snapshot writes, preventing an in-flight older read from overwriting a
 * just-published snapshot; an outage serves only the last known good one.
 */
export async function getPrimaryPublicResume(): Promise<PrimaryPublicResumeResult> {
  try {
    const resume = await getPublishedResume();
    if (resume) {
      return { state: "fresh", resume };
    }
  } catch (error) {
    console.error("public_resume.fresh_fetch_failed", error);
  }

  try {
    const snapshot = await getPublicResumeSnapshot();
    if (snapshot) {
      return { state: "snapshot", ...snapshot };
    }
  } catch (error) {
    console.error("public_resume.snapshot_read_failed", error);
  }

  return { state: "unavailable" };
}
