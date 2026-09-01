import "server-only";

import { getSupabaseServerAdminClient } from "@/lib/supabase/server-admin";
import { parseResumeContent } from "./resume-content";
import type { ResumeData } from "./resume-schema";

export const PUBLIC_RESUME_ID = "portfolio-resume";
export const PUBLIC_RESUME_CACHE_TAG = `resume:${PUBLIC_RESUME_ID}`;

const SNAPSHOT_TABLE = "public_resume_snapshots";

type SnapshotRow = {
  content: unknown;
  savedAt: string;
};

export type PublicResumeSnapshot = {
  resume: ResumeData;
  savedAt: string;
};

export async function getPublicResumeSnapshot(): Promise<PublicResumeSnapshot | null> {
  const { data, error } = await getSupabaseServerAdminClient()
    .from(SNAPSHOT_TABLE)
    .select("content, savedAt")
    .eq("key", PUBLIC_RESUME_ID)
    .maybeSingle<SnapshotRow>();

  if (error)
    throw new Error(`Failed to load public resume snapshot: ${error.message}`);
  if (!data) return null;

  const resume = parseResumeContent({ content: data.content });
  return resume ? { resume, savedAt: data.savedAt } : null;
}

export async function savePublicResumeSnapshot(
  content: unknown,
  sourceUpdatedAt?: string | null,
): Promise<ResumeData> {
  const resume = parseResumeContent({ content });
  if (!resume) {
    throw new Error("Refusing to save an invalid public resume snapshot.");
  }

  const { error } = await getSupabaseServerAdminClient()
    .from(SNAPSHOT_TABLE)
    .upsert(
      {
        key: PUBLIC_RESUME_ID,
        resumeId: PUBLIC_RESUME_ID,
        content: resume,
        sourceUpdatedAt: sourceUpdatedAt ?? null,
      },
      { onConflict: "key" },
    );

  if (error)
    throw new Error(`Failed to save public resume snapshot: ${error.message}`);
  return resume;
}
