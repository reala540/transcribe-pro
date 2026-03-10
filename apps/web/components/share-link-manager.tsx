"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
type LinkItem = { id: string; token: string; createdAt: string; expiresAt: string | null };
export function ShareLinkManager({ projectId, initialLinks }: { projectId: string; initialLinks: LinkItem[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [links, setLinks] = useState(initialLinks);
  async function createLink() {
    setBusy(true); setMessage(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/share-links`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Failed to create share link.");
      setLinks((current) => [payload.link, ...current]); setMessage(payload.shareUrl || "Share link created."); router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to create share link.");
    } finally { setBusy(false); }
  }
  async function revokeLink(linkId: string) {
    setBusy(true); setMessage(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/share-links/${linkId}/revoke`, { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Failed to revoke share link.");
      setLinks((current) => current.filter((link) => link.id !== linkId)); setMessage("Share link revoked."); router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to revoke share link.");
    } finally { setBusy(false); }
  }
  return <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-medium">Share transcript</h2><p className="mt-1 text-sm text-zinc-400">Create a link to view this transcript outside the dashboard.</p></div><button type="button" onClick={() => void createLink()} disabled={busy} className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-200 disabled:opacity-50">{busy ? "Working..." : "Create share link"}</button></div>{message ? <p className="mt-3 break-all text-sm text-zinc-400">{message}</p> : null}<div className="mt-4 space-y-3">{links.length === 0 ? <p className="text-sm text-zinc-500">No active share links yet.</p> : links.map((link) => <div key={link.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4"><div><p className="text-sm text-zinc-300">{link.token}</p><p className="mt-1 text-xs text-zinc-500">Created {new Date(link.createdAt).toLocaleString()}</p></div><button type="button" onClick={() => void revokeLink(link.id)} disabled={busy} className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-200 disabled:opacity-50">Revoke</button></div>)}</div></div>;
}
