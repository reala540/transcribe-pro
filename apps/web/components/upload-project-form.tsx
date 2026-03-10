"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function UploadProjectForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError(null); setStatusMessage(null);
    try {
      if (!file) throw new Error("Please choose a file.");
      setStatusMessage("Creating project...");
      const projectRes = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: title || file.name.replace(/\.[^/.]+$/, ""), language: language || null }) });
      if (!projectRes.ok) { const payload = await projectRes.json().catch(() => ({})); throw new Error(payload.error || "Failed to create project."); }
      const { project } = await projectRes.json();
      setStatusMessage("Preparing secure upload...");
      const presignRes = await fetch("/api/uploads/presign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: project.id, filename: file.name, contentType: file.type || "application/octet-stream", sizeBytes: file.size }) });
      if (!presignRes.ok) { const payload = await presignRes.json().catch(() => ({})); throw new Error(payload.error || "Failed to prepare upload."); }
      const { uploadUrl } = await presignRes.json();
      setStatusMessage("Uploading media...");
      const uploadRes = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type || "application/octet-stream" }, body: file });
      if (!uploadRes.ok) throw new Error("File upload failed.");
      setStatusMessage("Starting transcription...");
      const completeRes = await fetch("/api/uploads/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: project.id }) });
      if (!completeRes.ok) { const payload = await completeRes.json().catch(() => ({})); throw new Error(payload.error || "Failed to start transcription."); }
      router.push(`/dashboard/projects/${project.id}`); router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong."); setStatusMessage(null);
    } finally { setLoading(false); }
  }
  return <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><div><label className="mb-2 block text-sm text-zinc-300">Project title</label><input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-500" placeholder="Interview with client" /></div><div><label className="mb-2 block text-sm text-zinc-300">Language (optional)</label><input value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-500" placeholder="en" /></div><div><label className="mb-2 block text-sm text-zinc-300">Audio or video file</label><input type="file" accept="audio/*,video/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full text-sm text-zinc-300 file:mr-4 file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-2 file:text-black" required />{file ? <p className="mt-2 text-xs text-zinc-500">{file.name} · {(file.size / (1024 * 1024)).toFixed(2)} MB</p> : null}</div>{statusMessage ? <p className="text-sm text-zinc-400">{statusMessage}</p> : null}{error ? <p className="text-sm text-red-400">{error}</p> : null}<button type="submit" disabled={loading} className="rounded-xl bg-white px-5 py-3 font-medium text-black disabled:opacity-50">{loading ? "Working..." : "Upload and transcribe"}</button></form>;
}
