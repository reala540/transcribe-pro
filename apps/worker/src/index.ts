import { Worker } from "bullmq";
import IORedis from "ioredis";
import { prisma } from "@transcribe/db";
import { resolveMediaAccessUrl } from "@transcribe/storage";
import { getTranscriptionProvider } from "@transcribe/transcription";

if (!process.env.REDIS_URL) throw new Error("Missing REDIS_URL");
const connection = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
const provider = getTranscriptionProvider();

const worker = new Worker("transcription", async (bullJob) => {
  const { projectId, jobId } = bullJob.data as { projectId: string; jobId: string };
  await prisma.transcriptionJob.update({ where: { id: jobId }, data: { status: "PROCESSING", startedAt: new Date(), errorMessage: null } });
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error("Project not found");
  const mediaUrl = await resolveMediaAccessUrl({ storageKey: project.storageKey, sourceUrl: project.sourceUrl, expiresInSec: 1800 });
  if (!mediaUrl) throw new Error("Project media is not accessible.");
  await prisma.project.update({ where: { id: projectId }, data: { status: "PROCESSING" } });
  const result = await provider.transcribeFromUrl({ mediaUrl, language: project.language ?? undefined });
  await prisma.$transaction(async (tx) => {
    await tx.transcriptSegment.deleteMany({ where: { projectId } });
    if (result.segments.length > 0) {
      await tx.transcriptSegment.createMany({ data: result.segments.map((segment) => ({ projectId, startMs: segment.startMs, endMs: segment.endMs, speaker: segment.speaker ?? null, text: segment.text, confidence: segment.confidence ?? null, orderIndex: segment.orderIndex })) });
    }
    await tx.project.update({ where: { id: projectId }, data: { status: "COMPLETED", language: result.language ?? project.language, durationSec: result.durationSec ?? project.durationSec, providerMetadata: result.raw as object, lastEditedAt: null } });
    await tx.transcriptionJob.update({ where: { id: jobId }, data: { status: "COMPLETED", finishedAt: new Date() } });
    await tx.usageEvent.create({ data: { userId: project.userId, projectId, type: "TRANSCRIPTION_MINUTES", value: Math.max(1, Math.ceil((result.durationSec ?? 0) / 60)), metadata: { provider: project.provider ?? process.env.TRANSCRIPTION_PROVIDER } } });
  });
}, { connection, concurrency: 3 });

worker.on("failed", async (bullJob, error) => {
  const data = bullJob?.data as { projectId?: string; jobId?: string } | undefined;
  if (!data?.projectId || !data.jobId) return;
  console.error("[worker] transcription job failed", data, error);
  await prisma.transcriptionJob.update({ where: { id: data.jobId }, data: { status: "FAILED", errorMessage: error.message, finishedAt: new Date() } });
  await prisma.project.update({ where: { id: data.projectId }, data: { status: "FAILED" } });
});
worker.on("error", (error) => console.error("[worker] fatal worker error", error));
console.log("Worker listening on queue: transcription");
