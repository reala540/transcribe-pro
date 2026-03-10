"use client";
import { useState } from "react";
const formats = ["TXT", "DOCX", "SRT"] as const;
export function ExportButtons({ projectId }: { projectId: string }) {
  const [busyFormat, setBusyFormat] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  async function handleExport(format: (typeof formats)[number]) {
    setBusyFormat(format); setMessage(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/export`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ format }) });
      if (!response.ok) { const payload = await response.json().catch(() => ({})); throw new Error(payload.error || `Export ${format} failed.`); }
      const blob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition") || "";
      const match = /filename="([^"]+)"/.exec(contentDisposition);
      const filename = match?.[1] || `transcript.${format.toLowerCase()}`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
      setMessage(`${format} downloaded.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Export failed.");
    } finally { setBusyFormat(null); }
  }
  return <div className="space-y-2"><div className="flex flex-wrap gap-3">{formats.map((format) => <button key={format} type="button" onClick={() => void handleExport(format)} disabled={busyFormat !== null} className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-200 disabled:opacity-50">{busyFormat === format ? `Exporting ${format}...` : `Export ${format}`}</button>)}</div>{message ? <p className="text-sm text-zinc-400">{message}</p> : null}</div>;
}
