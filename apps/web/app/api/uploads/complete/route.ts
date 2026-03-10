import { NextResponse } from "next/server";
import { prisma } from "@transcribe/db";
import { getCurrentUserRecord } from "@/lib/auth/get-current-user";
import { AppError, logError, toErrorResponse } from "@/lib/errors";
import { getTranscriptionQueue } from "@/lib/queue";
import { objectExists } from "@/lib/storage";
import { trackUsage } from "@/lib/usage/track-usage";
import { CompleteUploadSchema } from "@/lib/validation";
export async function POST(request: Request) { try { const user = await getCurrentUserRecord(); const parsed = CompleteUploadSchema.parse(await request.json()); const project = await prisma.project.findFirst({ where: { id: parsed.projectId, userId: user.id } }); if (!project?.storageKey) throw new AppError("Project or upload not found", 404); if (!(await objectExists(project.storageKey))) throw new AppError("Upload not found in storage yet.", 409); const job = await prisma.transcriptionJob.create({ data: { projectId: project.id, provider: process.env.TRANSCRIPTION_PROVIDER ?? "deepgram", status: "PENDING" } }); await prisma.project.update({ where: { id: project.id }, data: { status: "QUEUED", provider: process.env.TRANSCRIPTION_PROVIDER ?? "deepgram" } }); await trackUsage({ userId: user.id, projectId: project.id, type: "UPLOAD_COUNT", value: 1 }); await getTranscriptionQueue().add("transcribe", { projectId: project.id, jobId: job.id }, { attempts: 3, backoff: { type: "exponential", delay: 5000 }, removeOnComplete: 100, removeOnFail: 100 }); return NextResponse.json({ ok: true, jobId: job.id }); } catch (error) { logError("api/uploads/complete.POST", error); return toErrorResponse(error); } }
