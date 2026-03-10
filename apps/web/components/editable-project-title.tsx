"use client";
import { useEffect, useState } from "react";

export function EditableProjectTitle({ projectId, initialTitle }: { projectId: string; initialTitle: string }) {
  const [title, setTitle] = useState(initialTitle);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => setTitle(initialTitle), [initialTitle]);
  async function save() {
    const nextTitle = title.trim();
    if (!nextTitle || nextTitle === initialTitle.trim()) return;
    setSaving(true); setMessage(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/title`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: nextTitle }) });
      if (!response.ok) { const payload = await response.json().catch(() => ({})); throw new Error(payload.error || "Failed to save title."); }
      setMessage("Saved");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save title.");
    } finally { setSaving(false); }
  }
  return <div className="flex flex-wrap items-center gap-3"><input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => void save()} className="w-full max-w-2xl rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-3xl font-semibold tracking-tight outline-none focus:border-zinc-600" /><span className="text-sm text-zinc-400">{saving ? "Saving title..." : message ?? "Title saves on blur"}</span></div>;
}
