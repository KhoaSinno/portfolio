import { DEFAULT_SECTION_ORDER, resumeSchema, type ResumeData } from "./resume-schema";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

type ResumeResponse = { content: unknown } | null;

async function request(path: string, init?: RequestInit, requiresAuth = false) {
  const accessToken = requiresAuth ? (await getSupabaseBrowserClient().auth.getSession()).data.session?.access_token : undefined;
  if (requiresAuth && !accessToken) throw new Error("Your admin session has expired. Please sign in again.");
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), ...init?.headers },
  });
  if (!response.ok) throw new Error(`Resume API request failed (${response.status}).`);
  return (await response.json()) as ResumeResponse;
}

function validateContent(response: ResumeResponse): ResumeData | null {
  if (!response || !response.content) return null;
  const raw = (typeof response.content === "object" ? { ...response.content } : {}) as Record<string, unknown>;
  if (!raw.sectionOrder) {
    raw.sectionOrder = [...DEFAULT_SECTION_ORDER];
  }
  const parsed = resumeSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export async function getDraftResume() {
  return validateContent(await request("/admin/resume", { cache: "no-store" }, true));
}

export async function getPublishedResume() {
  try {
    return validateContent(await request("/resume", { cache: "no-store" }));
  } catch (error) {
    if (error instanceof Error && error.message.includes("(404)")) return null;
    throw error;
  }
}

export async function saveResumeDraft(content: ResumeData) {
  await request("/admin/resume", { method: "PUT", body: JSON.stringify({ content, template: "technical" }) }, true);
}

export async function publishResume(content: ResumeData) {
  await request("/admin/resume/publish", { method: "POST", body: JSON.stringify({ content, template: "technical" }) }, true);
}
