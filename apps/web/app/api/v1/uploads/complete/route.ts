import { NextResponse } from "next/server";
import { prisma } from "@transcribe/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { AppError, logError, toErrorResponse } from "@/lib/errors";
import { getTranscriptionQueue } from "@/lib/queue";
import { objectExists } from "@/lib/storage";
import { CompleteUploadSchema } from "@/lib/validation";
export async function POST(request: Request) { try { const user = await authenticateApiRequest(request); if (!user) throw new AppError("Unauthorized", 401); const parsed = CompleteUploadSchema.parse(await request.json()); const project = await prisma.project.findFirst({ where: { id: parsed.projectId, userId: user.id } }); if (!project?.storageKey) throw new AppError("Project or upload not found", 404); if (!(await objectExists(project.storageKey))) throw new AppError("Upload not found in storage yet.", 409); const job = await prisma.transcriptionJob.create({ data: { projectId: project.id, provider: process.env.TRANSCRIPTION_PROVIDER ?? "deepgram", status: "PENDING" } }); await prisma.project.update({ where: { id: project.id }, data: { status: "QUEUED", provider: process.env.TRANSCRIPTION_PROVIDER ?? "deepgram" } }); await getTranscriptionQueue().add("transcribe", { projectId: project.id, jobId: job.id }, { attempts: 3, backoff: { type: "exponential", delay: 5000 }, removeOnComplete: 100, removeOnFail: 100 }); return NextResponse.json({ ok: true, jobId: job.id }); } catch (error) { logError("api/v1/uploads/complete.POST", error); return toErrorResponse(error); } }
