import { resumeSchema, type ResumeData } from "./resume-schema";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

type ResumeResponse = { content: unknown } | null;

async function request(path: string, init?: RequestInit) {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) throw new Error(`Resume API request failed (${response.status}).`);
  return (await response.json()) as ResumeResponse;
}

function validateContent(response: ResumeResponse): ResumeData | null {
  if (!response) return null;
  const parsed = resumeSchema.safeParse(response.content);
  return parsed.success ? parsed.data : null;
}

export async function getDraftResume() {
  return validateContent(await request("/admin/resume", { cache: "no-store" }));
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
  await request("/admin/resume", { method: "PUT", body: JSON.stringify({ content, template: "technical" }) });
}

export async function publishResume(content: ResumeData) {
  await request("/admin/resume/publish", { method: "POST", body: JSON.stringify({ content, template: "technical" }) });
}
