import { prisma } from "@transcribe/db";

export async function trackUsage(params: { userId: string; projectId?: string; type: "TRANSCRIPTION_MINUTES" | "UPLOAD_COUNT" | "EXPORT_COUNT" | "PROJECT_CREATED"; value: number; metadata?: Record<string, unknown> }) {
  await prisma.usageEvent.create({ data: { userId: params.userId, projectId: params.projectId, type: params.type, value: params.value, metadata: params.metadata } });
}
