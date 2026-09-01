import "server-only";

import { createClient } from "@supabase/supabase-js";

type ServerAdminClient = ReturnType<typeof createClient<any>>;

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

  client ??= createClient<any>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return client;
}
