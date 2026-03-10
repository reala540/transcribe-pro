import { NextResponse } from "next/server";
import { prisma } from "@transcribe/db";
import { getCurrentUserRecord } from "@/lib/auth/get-current-user";
import { AppError, logError, toErrorResponse } from "@/lib/errors";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) { try { const user = await getCurrentUserRecord(); const { id } = await params; const project = await prisma.project.findFirst({ where: { id, userId: user.id }, select: { id: true, status: true, updatedAt: true, lastEditedAt: true } }); if (!project) throw new AppError("Project not found", 404); return NextResponse.json({ project }); } catch (error) { logError("api/projects/[id]/status.GET", error); return toErrorResponse(error); } }
