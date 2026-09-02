import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type PublicResumeSnapshotRow = {
  key: string;
  resumeId: string;
  content: Json;
  sourceUpdatedAt: string | null;
  savedAt: string;
};

type Database = {
  public: {
    Tables: {
      public_resume_snapshots: {
        Row: PublicResumeSnapshotRow;
        Insert: Omit<PublicResumeSnapshotRow, "savedAt"> & {
          savedAt?: string;
        };
        Update: Partial<Omit<PublicResumeSnapshotRow, "key">>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

type ServerAdminClient = SupabaseClient<Database>;

let client: ServerAdminClient | undefined;

/** Server-only client for the single public snapshot table. */
export function getSupabaseServerAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Public resume snapshots are not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  client ??= createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return client;
}
