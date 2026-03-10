import { NextResponse } from "next/server";
import { prisma } from "@transcribe/db";
import { getCurrentUserRecord } from "@/lib/auth/get-current-user";
import { AppError, logError, toErrorResponse } from "@/lib/errors";
import { UpdateProjectTitleSchema } from "@/lib/validation";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const user = await getCurrentUserRecord(); const { id } = await params; const parsed = UpdateProjectTitleSchema.parse(await request.json()); const project = await prisma.project.findFirst({ where: { id, userId: user.id } }); if (!project) throw new AppError("Project not found", 404); const updated = await prisma.project.update({ where: { id }, data: { title: parsed.title, lastEditedAt: new Date() } }); return NextResponse.json({ project: updated }); } catch (error) { logError("api/projects/[id]/title.PATCH", error); return toErrorResponse(error); } }
