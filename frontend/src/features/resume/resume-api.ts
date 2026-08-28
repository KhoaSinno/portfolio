import { defaultResume, type ResumeData } from "./resume-schema";
import { parseResumeContent } from "./resume-content";
import { API_BASE_URL } from "@/lib/api/client";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type ResumeResponse = {
  id?: string;
  title?: string;
  isPrimary?: boolean;
  content: unknown;
  slug?: string | null;
  status?: string;
  viewsCount?: number;
  lastViewedAt?: string | null;
  updatedAt?: string;
} | null;

export type DraftResume = {
  id: string;
  title: string;
  isPrimary: boolean;
  content: ResumeData;
  slug: string | null;
  status?: string;
  viewsCount?: number;
  lastViewedAt?: string | null;
  updatedAt?: string;
} | null;

export type ResumeProfileItem = {
  id: string;
  title: string;
  slug: string | null;
  isPrimary: boolean;
  status: "DRAFT" | "PUBLISHED";
  template: string;
  viewsCount: number;
  lastViewedAt: string | null;
  publishedAt: string | null;
  updatedAt: string;
  createdAt: string;
  _count?: {
    versions: number;
  };
};

async function getAuthToken(): Promise<string> {
  const accessToken = (await getSupabaseBrowserClient().auth.getSession()).data
    .session?.access_token;
  if (!accessToken)
    throw new Error("Your admin session has expired. Please sign in again.");
  return accessToken;
}

// --- Multi-CV Admin Management Endpoints ---

export async function listResumes(): Promise<ResumeProfileItem[]> {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/admin/resumes`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok)
    throw new Error(`Failed to list resumes (${response.status}).`);
  return (await response.json()) as ResumeProfileItem[];
}

export async function getResumeProfile(id: string): Promise<DraftResume> {
  const token = await getAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/admin/resumes/${encodeURIComponent(id)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );
  if (!response.ok)
    throw new Error(`Failed to load resume profile (${response.status}).`);
  const data = (await response.json()) as ResumeResponse;
  const content = parseResumeContent(data);
  if (!content || !data?.id) return null;
  return {
    id: data.id,
    title: data.title || "Main Resume",
    isPrimary: Boolean(data.isPrimary),
    content,
    slug: data.slug ?? null,
    status: data.status,
    viewsCount: data.viewsCount,
    lastViewedAt: data.lastViewedAt,
    updatedAt: data.updatedAt,
  };
}

export async function createResumeProfile(dto: {
  title: string;
  slug?: string;
  sourceResumeId?: string;
}): Promise<DraftResume> {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/admin/resumes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dto),
  });
  const data = (await response.json()) as {
    message?: string;
    id?: string;
  } & ResumeResponse;
  if (!response.ok) {
    throw new Error(
      data.message || `Failed to create resume profile (${response.status}).`,
    );
  }
  const content = parseResumeContent(data);
  if (!content || !data.id) return null;
  return {
    id: data.id,
    title: data.title || dto.title,
    isPrimary: Boolean(data.isPrimary),
    content,
    slug: data.slug ?? null,
    status: data.status,
    updatedAt: data.updatedAt,
  };
}

export async function updateResumeMeta(
  id: string,
  dto: { title?: string; slug?: string },
) {
  const token = await getAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/admin/resumes/${encodeURIComponent(id)}/meta`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    },
  );
  const data = (await response.json()) as { message?: string };
  if (!response.ok) {
    throw new Error(
      data.message || `Failed to update metadata (${response.status}).`,
    );
  }
  return data;
}

export async function saveResumeDraftById(id: string, content: ResumeData) {
  const token = await getAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/admin/resumes/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content, template: "technical" }),
    },
  );
  if (!response.ok)
    throw new Error(`Failed to save draft (${response.status}).`);
}

export async function publishResumeById(id: string, content: ResumeData) {
  const token = await getAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/admin/resumes/${encodeURIComponent(id)}/publish`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content, template: "technical" }),
    },
  );
  if (!response.ok)
    throw new Error(`Failed to publish resume (${response.status}).`);
}

export async function setResumePrimary(id: string) {
  const token = await getAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/admin/resumes/${encodeURIComponent(id)}/set-primary`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  const data = (await response.json()) as { message?: string };
  if (!response.ok)
    throw new Error(
      data.message || `Failed to set primary (${response.status}).`,
    );
}

export async function deleteResumeProfile(id: string) {
  const token = await getAuthToken();
  const response = await fetch(
    `${API_BASE_URL}/admin/resumes/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  const data = (await response.json()) as { message?: string };
  if (!response.ok) {
    throw new Error(
      data.message || `Failed to delete resume profile (${response.status}).`,
    );
  }
  return data;
}

// --- Legacy / Primary Direct Helpers ---

export async function getDraftResume(): Promise<DraftResume> {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/admin/resume`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok)
    throw new Error(`Failed to load draft (${response.status}).`);
  const data = (await response.json()) as ResumeResponse;
  const content = parseResumeContent(data);
  if (!content || !data?.id) return null;
  return {
    id: data.id,
    title: data.title || "Main Resume",
    isPrimary: Boolean(data.isPrimary),
    content,
    slug: data.slug ?? null,
    status: data.status,
    updatedAt: data.updatedAt,
  };
}

export async function saveResumeDraft(content: ResumeData) {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/admin/resume`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content, template: "technical" }),
  });
  if (!response.ok)
    throw new Error(`Failed to save draft (${response.status}).`);
}

export async function publishResume(content: ResumeData) {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/admin/resume/publish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content, template: "technical" }),
  });
  if (!response.ok) throw new Error(`Failed to publish (${response.status}).`);
}

// --- Version History ---

export type ResumeVersionItem = {
  id: string;
  version: number;
  template: string;
  createdAt: string;
  content: ResumeData;
};

export async function getResumeVersions(
  resumeId?: string,
): Promise<ResumeVersionItem[]> {
  const token = await getAuthToken();
  const url = resumeId
    ? `${API_BASE_URL}/admin/resumes/${encodeURIComponent(resumeId)}/versions`
    : `${API_BASE_URL}/admin/resume/versions`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok)
    throw new Error(`Failed to load versions (${response.status}).`);
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
    content: parseResumeContent({ content: item.content }) ?? defaultResume,
  }));
}

export async function rollbackResumeVersion(
  versionId: string,
  resumeId?: string,
): Promise<ResumeData> {
  const token = await getAuthToken();
  const url = resumeId
    ? `${API_BASE_URL}/admin/resumes/${encodeURIComponent(resumeId)}/rollback/${encodeURIComponent(versionId)}`
    : `${API_BASE_URL}/admin/resume/rollback/${encodeURIComponent(versionId)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok)
    throw new Error(`Failed to rollback version (${response.status}).`);
  const data = (await response.json()) as { content: unknown };
  const valid = parseResumeContent(data);
  if (!valid) throw new Error("Restored version content was invalid.");
  return valid;
}
