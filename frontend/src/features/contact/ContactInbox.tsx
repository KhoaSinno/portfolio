"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Archive,
  Download,
  ExternalLink,
  FileText,
  Inbox,
  Loader2,
  Mail,
  MessageSquareText,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  getAttachmentDownloadUrl,
  getContact,
  listContacts,
  updateContact,
  type ContactDetail,
  type ContactListItem,
  type ContactStatus,
  type ContactTopic,
} from "./contact-inbox-api";

const STATUSES: Array<{ value: ContactStatus | ""; label: string }> = [
  { value: "NEW", label: "New" },
  { value: "REVIEWED", label: "Reviewed" },
  { value: "FOLLOW_UP", label: "Follow-up" },
  { value: "ARCHIVED", label: "Archived" },
  { value: "", label: "All statuses" },
];

const TOPICS: Array<{ value: ContactTopic | ""; label: string }> = [
  { value: "", label: "All topics" },
  { value: "HIRING", label: "Hiring" },
  { value: "COLLABORATION", label: "Collaboration" },
  { value: "GENERAL", label: "General" },
];

function displayTopic(topic: ContactTopic) {
  return topic[0] + topic.slice(1).toLowerCase();
}

function displayStatus(status: ContactStatus) {
  return status.replace("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function statusClass(status: ContactStatus) {
  return {
    NEW: "border-sky-200 bg-sky-50 text-sky-800",
    REVIEWED: "border-violet-200 bg-violet-50 text-violet-800",
    FOLLOW_UP: "border-amber-200 bg-amber-50 text-amber-800",
    ARCHIVED: "border-zinc-200 bg-zinc-100 text-zinc-700",
  }[status];
}

export function ContactInbox() {
  const [status, setStatus] = useState<ContactStatus | "">("NEW");
  const [topic, setTopic] = useState<ContactTopic | "">("");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<ContactListItem[]>([]);
  const [selected, setSelected] = useState<ContactDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const loadList = useCallback(async (filters: {
    status?: ContactStatus;
    topic?: ContactTopic;
    q?: string;
  }) => {
    setLoading(true);
    setNotice(null);
    try {
      const result = await listContacts(filters);
      setItems(result.items);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not load the contact inbox.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(
      () => void loadList({ status: status || undefined, topic: topic || undefined }),
      0,
    );
    return () => window.clearTimeout(timer);
  }, [loadList, status, topic]); // Filters intentionally load immediately.

  const selectContact = async (id: string) => {
    setLoadingDetail(true);
    setNotice(null);
    try {
      const detail = await getContact(id);
      setSelected(detail);
      setNote(detail.internalNote ?? "");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not load this contact.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const save = async (data: { status?: ContactStatus; internalNote?: string }) => {
    if (!selected) return;
    setSaving(true);
    setNotice(null);
    try {
      const updated = await updateContact(selected.id, data);
      setSelected(updated);
      setNote(updated.internalNote ?? "");
      setItems((previous) => previous.map((item) => item.id === updated.id ? { ...item, ...updated } : item));
      setNotice("Contact saved.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save this contact.");
    } finally {
      setSaving(false);
    }
  };

  const download = async () => {
    if (!selected) return;
    setNotice(null);
    try {
      const { url } = await getAttachmentDownloadUrl(selected.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not prepare the private PDF.");
    }
  };

  return (
    <main className="min-h-dvh bg-zinc-100 p-4 text-zinc-900 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">Sinoo Hub CMS</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950">Contact inbox</h1>
            <p className="mt-1 text-sm text-zinc-600">Private messages from your portfolio. Reply by email, then track the next step here.</p>
          </div>
          <Link href="/admin/resume" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"><FileText aria-hidden="true" className="h-4 w-4" />Resume CMS</Link>
        </header>

        {notice && <p role="status" className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">{notice}</p>}

        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 p-4">
            <form onSubmit={(event) => { event.preventDefault(); void loadList({ status: status || undefined, topic: topic || undefined, q: query.trim() || undefined }); }} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
              <label className="relative block"><span className="sr-only">Search contacts</span><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-zinc-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search email or message" className="min-h-11 w-full rounded-xl border border-zinc-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" /></label>
              <select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value as ContactStatus | "")} className="min-h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200">{STATUSES.map((item) => <option key={item.label} value={item.value}>{item.label}</option>)}</select>
              <select aria-label="Filter by topic" value={topic} onChange={(event) => setTopic(event.target.value as ContactTopic | "")} className="min-h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200">{TOPICS.map((item) => <option key={item.label} value={item.value}>{item.label}</option>)}</select>
              <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"><Search aria-hidden="true" className="h-4 w-4" />Search</button>
            </form>
          </div>

          <div className="grid min-h-[580px] lg:grid-cols-[minmax(19rem,0.85fr)_minmax(0,1.4fr)]">
            <aside className="border-b border-zinc-200 lg:border-b-0 lg:border-r">
              <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3"><p className="text-sm font-semibold text-zinc-800">{status === "NEW" ? "New messages" : "Messages"} <span className="ml-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">{items.length}</span></p><button type="button" onClick={() => void loadList({ status: status || undefined, topic: topic || undefined, q: query.trim() || undefined })} aria-label="Refresh contact inbox" className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"><RefreshCw aria-hidden="true" className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button></div>
              {loading ? <div className="grid min-h-56 place-items-center text-sm text-zinc-500"><Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /></div> : items.length === 0 ? <div className="grid min-h-56 place-items-center p-6 text-center"><Inbox aria-hidden="true" className="h-8 w-8 text-zinc-300" /><p className="mt-3 text-sm font-semibold text-zinc-700">No contacts found</p><p className="mt-1 text-sm text-zinc-500">Try another filter or check back later.</p></div> : <ul className="max-h-[520px] overflow-y-auto">{items.map((item) => <li key={item.id}><button type="button" onClick={() => void selectContact(item.id)} className={`w-full border-b border-zinc-100 p-4 text-left transition hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-indigo-500 ${selected?.id === item.id ? "bg-indigo-50/70" : ""}`}><div className="flex items-start justify-between gap-2"><p className="min-w-0 truncate text-sm font-bold text-zinc-900">{item.email}</p><span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusClass(item.status)}`}>{displayStatus(item.status)}</span></div><div className="mt-2 flex items-center justify-between gap-2"><span className="text-xs font-medium text-indigo-700">{displayTopic(item.topic)}</span><time className="text-xs text-zinc-500" dateTime={item.createdAt}>{formatDate(item.createdAt)}</time></div><p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-600">{item.message}</p></button></li>)}</ul>}
            </aside>

            <section className="p-5 sm:p-7">
              {loadingDetail ? <div className="grid min-h-72 place-items-center"><Loader2 aria-label="Loading contact" className="h-6 w-6 animate-spin text-indigo-600" /></div> : selected ? <ContactDetailView contact={selected} note={note} saving={saving} onNoteChange={setNote} onSave={save} onDownload={download} /> : <div className="grid min-h-72 place-items-center text-center"><MessageSquareText aria-hidden="true" className="h-10 w-10 text-zinc-300" /><div><h2 className="mt-4 text-lg font-bold text-zinc-800">Select a contact</h2><p className="mt-1 max-w-sm text-sm leading-relaxed text-zinc-500">Choose a message to read it, reply by email, add a private note, or download its private PDF.</p></div></div>}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function ContactDetailView({ contact, note, saving, onNoteChange, onSave, onDownload }: { contact: ContactDetail; note: string; saving: boolean; onNoteChange: (value: string) => void; onSave: (data: { status?: ContactStatus; internalNote?: string }) => void; onDownload: () => void }) {
  return <article><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">{displayTopic(contact.topic)}</p><h2 className="mt-1 break-all text-xl font-bold text-zinc-950">{contact.email}</h2><time className="mt-1 block text-sm text-zinc-500" dateTime={contact.createdAt}>{formatDate(contact.createdAt)}</time></div><label className="text-sm font-medium text-zinc-700">Status<select value={contact.status} disabled={saving} onChange={(event) => onSave({ status: event.target.value as ContactStatus })} className="mt-1 block min-h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200">{STATUSES.filter((item) => item.value).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label></div><div className="mt-6 rounded-2xl bg-zinc-50 p-4 text-sm leading-7 text-zinc-800 whitespace-pre-wrap break-words">{contact.message}</div><div className="mt-5 flex flex-wrap gap-2"><a href={`mailto:${encodeURIComponent(contact.email)}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"><Mail aria-hidden="true" className="h-4 w-4" />Reply by email</a>{contact.jdLink && <a href={contact.jdLink} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"><ExternalLink aria-hidden="true" className="h-4 w-4" />Open JD link</a>}{contact.hasAttachment && <button type="button" onClick={onDownload} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-800 transition hover:bg-indigo-100"><Download aria-hidden="true" className="h-4 w-4" />Download private PDF</button>}</div>{contact.notificationStatus === "FAILED" && <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-relaxed text-amber-900"><strong>Owner notification failed.</strong> The message is saved here; reply directly by email. {contact.notificationError && <span className="block mt-1 text-xs">{contact.notificationError}</span>}</p>}<div className="mt-7 border-t border-zinc-200 pt-5"><label htmlFor="internal-note" className="text-sm font-semibold text-zinc-800">Private note</label><p className="mt-1 text-xs text-zinc-500">Visible only in this inbox.</p><textarea id="internal-note" rows={4} value={note} onChange={(event) => onNoteChange(event.target.value)} className="mt-2 w-full rounded-xl border border-zinc-300 p-3 text-sm leading-relaxed outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" placeholder="Add a follow-up reminder, context, or outcome…" /><div className="mt-3 flex justify-end"><button type="button" disabled={saving} onClick={() => onSave({ internalNote: note })} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 disabled:opacity-60"><Archive aria-hidden="true" className="h-4 w-4" />{saving ? "Saving…" : "Save note"}</button></div></div></article>;
}
