import { NextResponse } from "next/server";
import { prisma } from "@transcribe/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { AppError, logError, toErrorResponse } from "@/lib/errors";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const user = await authenticateApiRequest(request); if (!user) throw new AppError("Unauthorized", 401); const { id } = await params; const project = await prisma.project.findFirst({ where: { id, userId: user.id }, include: { jobs: { orderBy: { createdAt: "desc" } } } }); if (!project) throw new AppError("Project not found", 404); return NextResponse.json({ project }); } catch (error) { logError("api/v1/projects/[id].GET", error); return toErrorResponse(error); } }
