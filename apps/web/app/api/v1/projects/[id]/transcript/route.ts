import { NextResponse } from "next/server";
import { prisma } from "@transcribe/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { AppError, logError, toErrorResponse } from "@/lib/errors";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const user = await authenticateApiRequest(request); if (!user) throw new AppError("Unauthorized", 401); const { id } = await params; const project = await prisma.project.findFirst({ where: { id, userId: user.id }, include: { segments: { orderBy: { orderIndex: "asc" } } } }); if (!project) throw new AppError("Project not found", 404); return NextResponse.json({ project: { id: project.id, title: project.title, status: project.status, language: project.language, durationSec: project.durationSec }, transcript: project.segments }); } catch (error) { logError("api/v1/projects/[id]/transcript.GET", error); return toErrorResponse(error); } }
