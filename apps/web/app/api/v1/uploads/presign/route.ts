import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@transcribe/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { createPresignedUpload } from "@/lib/storage";
import { AppError, logError, toErrorResponse } from "@/lib/errors";
import { PresignUploadSchema } from "@/lib/validation";
const allowedMimePrefixes = ["audio/", "video/"];
export async function POST(request: Request) { try { const user = await authenticateApiRequest(request); if (!user) throw new AppError("Unauthorized", 401); const parsed = PresignUploadSchema.parse(await request.json()); if (!allowedMimePrefixes.some((prefix) => parsed.contentType.startsWith(prefix))) throw new AppError("Unsupported file type", 400); const project = await prisma.project.findFirst({ where: { id: parsed.projectId, userId: user.id } }); if (!project) throw new AppError("Project not found", 404); const safeName = parsed.filename.replace(/[^a-zA-Z0-9._-]/g, "_"); const key = `uploads/${user.id}/${project.id}/${randomUUID()}-${safeName}`; const signed = await createPresignedUpload({ key, contentType: parsed.contentType }); await prisma.project.update({ where: { id: project.id }, data: { sourceFilename: parsed.filename, sourceMimeType: parsed.contentType, storageKey: key, sourceUrl: signed.publicUrl, status: "UPLOADED" } }); return NextResponse.json(signed); } catch (error) { logError("api/v1/uploads/presign.POST", error); return toErrorResponse(error); } }
