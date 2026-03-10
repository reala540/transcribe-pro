import { NextResponse } from "next/server";
import { prisma } from "@transcribe/db";
import { getCurrentUserRecord } from "@/lib/auth/get-current-user";
import { getUserEntitlements } from "@/lib/billing/entitlements";
import { AppError, logError, toErrorResponse } from "@/lib/errors";
import { trackUsage } from "@/lib/usage/track-usage";
import { CreateProjectSchema } from "@/lib/validation";
export async function GET() { try { const user = await getCurrentUserRecord(); const projects = await prisma.project.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }); return NextResponse.json({ projects }); } catch (error) { logError("api/projects.GET", error); return toErrorResponse(error); } }
export async function POST(request: Request) { try { const user = await getCurrentUserRecord(); const entitlements = await getUserEntitlements(user.id, user.plan); if (!entitlements.canUpload) throw new AppError("Monthly usage limit reached for your current plan.", 403); const parsed = CreateProjectSchema.parse(await request.json()); const project = await prisma.project.create({ data: { userId: user.id, title: parsed.title?.trim() || "Untitled project", language: parsed.language || null, status: "DRAFT" } }); await trackUsage({ userId: user.id, projectId: project.id, type: "PROJECT_CREATED", value: 1 }); return NextResponse.json({ project }, { status: 201 }); } catch (error) { logError("api/projects.POST", error); return toErrorResponse(error); } }
