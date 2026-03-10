import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@transcribe/db";
import { getCurrentUserRecord } from "@/lib/auth/get-current-user";
import { getUserEntitlements } from "@/lib/billing/entitlements";
import { AppError, logError, toErrorResponse } from "@/lib/errors";
import { createPresignedUpload } from "@/lib/storage";
import { PresignUploadSchema } from "@/lib/validation";
const allowedMimePrefixes = ["audio/", "video/"];
export async function POST(request: Request) { try { const user = await getCurrentUserRecord(); const entitlements = await getUserEntitlements(user.id, user.plan); const parsed = PresignUploadSchema.parse(await request.json()); const { projectId, filename, contentType, sizeBytes } = parsed; if (!allowedMimePrefixes.some((prefix) => contentType.startsWith(prefix))) throw new AppError("Unsupported file type", 400); if (sizeBytes > entitlements.limits.maxUploadSizeMb * 1024 * 1024) throw new AppError("File exceeds plan upload limit", 400); const project = await prisma.project.findFirst({ where: { id: projectId, userId: user.id } }); if (!project) throw new AppError("Project not found", 404); if (!["DRAFT","FAILED","UPLOADED"].includes(project.status)) throw new AppError("Project is not ready for a new upload.", 409); const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_"); const key = `uploads/${user.id}/${project.id}/${randomUUID()}-${safeName}`; const signed = await createPresignedUpload({ key, contentType }); await prisma.project.update({ where: { id: project.id }, data: { sourceFilename: filename, sourceMimeType: contentType, storageKey: key, sourceUrl: signed.publicUrl, status: "UPLOADED" } }); return NextResponse.json(signed); } catch (error) { logError("api/uploads/presign.POST", error); return toErrorResponse(error); } }
