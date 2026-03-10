import { NextResponse } from "next/server";
import { prisma } from "@transcribe/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { AppError, logError, toErrorResponse } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { trackUsage } from "@/lib/usage/track-usage";
import { ApiProjectCreateSchema } from "@/lib/validation";
export async function GET(request: Request) { try { const user = await authenticateApiRequest(request); if (!user) throw new AppError("Unauthorized", 401); const limiter = await rateLimit(`api:list-projects:${user.id}`, 120, 60); if (!limiter.allowed) throw new AppError("Rate limit exceeded", 429); const projects = await prisma.project.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 }); return NextResponse.json({ projects }); } catch (error) { logError("api/v1/projects.GET", error); return toErrorResponse(error); } }
export async function POST(request: Request) { try { const user = await authenticateApiRequest(request); if (!user) throw new AppError("Unauthorized", 401); const limiter = await rateLimit(`api:create-project:${user.id}`, 60, 60); if (!limiter.allowed) throw new AppError("Rate limit exceeded", 429); const parsed = ApiProjectCreateSchema.parse(await request.json()); const project = await prisma.project.create({ data: { userId: user.id, title: parsed.title?.trim() || "API Project", language: parsed.language || null, status: "DRAFT" } }); await trackUsage({ userId: user.id, projectId: project.id, type: "PROJECT_CREATED", value: 1, metadata: { source: "api" } }); return NextResponse.json({ project }, { status: 201 }); } catch (error) { logError("api/v1/projects.POST", error); return toErrorResponse(error); } }
