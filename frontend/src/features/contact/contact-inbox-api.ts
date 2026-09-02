import { API_BASE_URL, getApiErrorMessage } from "@/lib/api/client";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export type ContactTopic = "HIRING" | "COLLABORATION" | "GENERAL";
export type ContactStatus = "NEW" | "REVIEWED" | "FOLLOW_UP" | "ARCHIVED";
export type NotificationStatus = "PENDING" | "SENT" | "FAILED";

export type ContactListItem = {
  id: string;
  topic: ContactTopic;
  email: string;
  message: string;
  jdLink: string | null;
  fileName: string | null;
  fileSize: number | null;
  status: ContactStatus;
  notificationStatus: NotificationStatus;
  createdAt: string;
  updatedAt: string;
};

export type ContactDetail = ContactListItem & {
  internalNote: string | null;
  notificationError: string | null;
  reviewedAt: string | null;
  archivedAt: string | null;
  hasAttachment: boolean;
};

async function getAuthToken() {
  const token = (await getSupabaseBrowserClient().auth.getSession()).data.session?.access_token;
  if (!token) throw new Error("Your admin session has expired. Please sign in again.");
  return token;
}

async function authorizedFetch(path: string, init?: RequestInit) {
  const token = await getAuthToken();
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) },
    cache: "no-store",
  });
}

export async function listContacts(filters: {
  status?: ContactStatus;
  topic?: ContactTopic;
  q?: string;
  cursor?: string;
}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const response = await authorizedFetch(`/admin/contacts?${params.toString()}`);
  if (!response.ok) throw new Error(await getApiErrorMessage(response, "Could not load the contact inbox."));
  return (await response.json()) as { items: ContactListItem[]; nextCursor: string | null };
}

export async function getContact(id: string) {
  const response = await authorizedFetch(`/admin/contacts/${encodeURIComponent(id)}`);
  if (!response.ok) throw new Error(await getApiErrorMessage(response, "Could not load this contact."));
  return (await response.json()) as ContactDetail;
}

export async function updateContact(id: string, data: { status?: ContactStatus; internalNote?: string }) {
  const response = await authorizedFetch(`/admin/contacts/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(await getApiErrorMessage(response, "Could not update this contact."));
  return (await response.json()) as ContactDetail;
}

export async function getAttachmentDownloadUrl(id: string) {
  const response = await authorizedFetch(`/admin/contacts/${encodeURIComponent(id)}/attachment-url`, { method: "POST" });
  if (!response.ok) throw new Error(await getApiErrorMessage(response, "Could not prepare the private PDF."));
  return (await response.json()) as { url: string; expiresInSeconds: number };
}
