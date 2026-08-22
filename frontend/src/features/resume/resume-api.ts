import { DEFAULT_SECTION_ORDER, resumeSchema, type ResumeData } from "./resume-schema";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

type ResumeResponse = { content: unknown; slug?: string | null } | null;
export type DraftResume = { content: ResumeData; slug?: string | null } | null;

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
  const response = await request("/admin/resume", { cache: "no-store" }, true);
  const content = validateContent(response);
  return content ? { content, slug: response?.slug ?? null } : null;
}

export async function getPublishedResume(slug?: string) {
  try {
    return validateContent(await request(slug ? `/resume/${encodeURIComponent(slug)}` : "/resume", { cache: "no-store" }));
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

export type ResumeVersionItem = {
  id: string;
  version: number;
  template: string;
  createdAt: string;
  content: ResumeData;
};

export async function getResumeVersions(): Promise<ResumeVersionItem[]> {
  const accessToken = (await getSupabaseBrowserClient().auth.getSession()).data.session?.access_token;
  if (!accessToken) throw new Error("Your admin session has expired. Please sign in again.");
  const response = await fetch(`${API_URL}/admin/resume/versions`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Failed to load versions (${response.status}).`);
  const rawList = (await response.json()) as Array<{
    id: string;
    version: number;
    template: string;
    createdAt: string;
    content: unknown;
  }>;
  return rawList.map((item) => ({
    id: item.id,
    version: item.version,
    template: item.template,
    createdAt: item.createdAt,
    content: validateContent({ content: item.content }) ?? {
      basics: { name: "", headline: "", email: "", location: "", website: "", linkedin: "", github: "" },
      summary: "",
      technicalSkills: [],
      experience: [],
      projects: [],
      education: [],
      sectionOrder: [...DEFAULT_SECTION_ORDER],
    },
  }));
}

export async function rollbackResumeVersion(versionId: string): Promise<ResumeData> {
  const accessToken = (await getSupabaseBrowserClient().auth.getSession()).data.session?.access_token;
  if (!accessToken) throw new Error("Your admin session has expired. Please sign in again.");
  const response = await fetch(`${API_URL}/admin/resume/rollback/${encodeURIComponent(versionId)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error(`Failed to rollback version (${response.status}).`);
  const data = (await response.json()) as { content: unknown };
  const valid = validateContent(data);
  if (!valid) throw new Error("Restored version content was invalid.");
  return valid;
}
