"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function RetryTranscriptionButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  async function retry() {
    setBusy(true); setMessage(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/retry`, { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Retry failed.");
      setMessage("Retry queued."); router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Retry failed.");
    } finally { setBusy(false); }
  }
  return <div className="space-y-2"><button type="button" onClick={() => void retry()} disabled={busy} className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-200 disabled:opacity-50">{busy ? "Retrying..." : "Retry transcription"}</button>{message ? <p className="text-sm text-zinc-400">{message}</p> : null}</div>;
}
