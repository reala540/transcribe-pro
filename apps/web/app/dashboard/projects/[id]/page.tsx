import { notFound } from "next/navigation";
import { prisma } from "@transcribe/db";
import { EditableProjectTitle } from "@/components/editable-project-title";
import { ExportButtons } from "@/components/export-buttons";
import { ProjectStatusPoller } from "@/components/project-status-poller";
import { RetryTranscriptionButton } from "@/components/retry-transcription-button";
import { ShareLinkManager } from "@/components/share-link-manager";
import { TranscriptEditor } from "@/components/transcript-editor";
import { getCurrentUserRecord } from "@/lib/auth/get-current-user";
import { resolveMediaAccessUrl } from "@/lib/storage";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUserRecord();
  const { id } = await params;
  const project = await prisma.project.findFirst({ where: { id, userId: user.id }, include: { segments: { orderBy: { orderIndex: "asc" } }, jobs: { orderBy: { createdAt: "desc" } }, sharedLinks: { where: { revokedAt: null }, orderBy: { createdAt: "desc" } } } });
  if (!project) notFound();
  const mediaUrl = await resolveMediaAccessUrl({ storageKey: project.storageKey, sourceUrl: project.sourceUrl, expiresInSec: 1800 });
  const processing = ["QUEUED", "PROCESSING"].includes(project.status);
  const failedJob = project.jobs.find((job) => job.status === "FAILED");
  return <div className="space-y-8"><ProjectStatusPoller projectId={project.id} enabled={processing} /><div className="flex flex-wrap items-start justify-between gap-4"><div className="space-y-3"><EditableProjectTitle projectId={project.id} initialTitle={project.title} /><p className="text-zinc-400">{project.sourceFilename ?? "No source file"}</p></div><div className="flex flex-wrap items-center gap-3"><span className="rounded-full border border-zinc-700 px-4 py-2 text-sm uppercase tracking-wide text-zinc-300">{project.status}</span>{project.status === "COMPLETED" ? <ExportButtons projectId={project.id} /> : null}{project.status === "FAILED" ? <RetryTranscriptionButton projectId={project.id} /> : null}</div></div><div className="grid gap-4 md:grid-cols-3"><div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Language</p><p className="mt-2 text-lg font-medium">{project.language ?? "Unknown"}</p></div><div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Duration</p><p className="mt-2 text-lg font-medium">{project.durationSec ? `${project.durationSec}s` : "Unknown"}</p></div><div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Provider</p><p className="mt-2 text-lg font-medium">{project.provider ?? "Pending"}</p></div></div>{project.status === "FAILED" ? <div className="rounded-2xl border border-red-800/60 bg-zinc-900 p-5 text-zinc-300"><p className="font-medium text-red-300">Transcription failed.</p><p className="mt-2 text-sm text-zinc-400">{failedJob?.errorMessage ?? "No specific failure reason was captured."}</p></div> : null}{project.status !== "COMPLETED" ? <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-zinc-400">{processing ? "Transcription is still processing. This page will refresh automatically when the job finishes." : "Upload media and start transcription to begin editing."}</div> : <><TranscriptEditor projectId={project.id} mediaUrl={mediaUrl} mediaType={project.sourceMimeType} initialSegments={project.segments.map((segment) => ({ id: segment.id, startMs: segment.startMs, endMs: segment.endMs, speaker: segment.speaker, text: segment.text, isEdited: segment.isEdited }))} /><ShareLinkManager projectId={project.id} initialLinks={project.sharedLinks.map((link) => ({ id: link.id, token: link.token, createdAt: link.createdAt.toISOString(), expiresAt: link.expiresAt?.toISOString() ?? null }))} /></>}</div>;
}
