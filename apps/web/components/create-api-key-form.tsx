"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function CreateApiKeyForm() {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  async function handleCreate() {
    setBusy(true); setMessage(null);
    try {
      const response = await fetch("/api/api-keys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ label }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Failed to create API key.");
      setRawKey(payload.rawKey); setMessage("API key created. Copy it now — it will only be shown once."); setLabel(""); router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to create API key.");
    } finally { setBusy(false); }
  }
  return <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><div className="flex flex-wrap gap-3"><input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Key label" className="min-w-[220px] flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-600" /><button type="button" onClick={() => void handleCreate()} disabled={busy} className="rounded-xl bg-white px-5 py-3 font-medium text-black disabled:opacity-50">{busy ? "Creating..." : "Create API key"}</button></div>{message ? <p className="mt-3 text-sm text-zinc-400">{message}</p> : null}{rawKey ? <div className="mt-4 rounded-xl border border-emerald-700/60 bg-zinc-950 p-4"><p className=\"mb-2 text-xs uppercase tracking-wide text-emerald-400">Copy this key now</p><code className=\"block break-all text-sm text-zinc-200">{rawKey}</code></div> : null}</div>;
}
