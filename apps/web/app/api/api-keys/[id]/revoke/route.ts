import { NextResponse } from "next/server";
import { prisma } from "@transcribe/db";
import { getCurrentUserRecord } from "@/lib/auth/get-current-user";
import { AppError, logError, toErrorResponse } from "@/lib/errors";
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) { try { const user = await getCurrentUserRecord(); const { id } = await params; const apiKey = await prisma.apiKey.findFirst({ where: { id, userId: user.id, revokedAt: null } }); if (!apiKey) throw new AppError("API key not found", 404); await prisma.apiKey.update({ where: { id }, data: { revokedAt: new Date() } }); return NextResponse.json({ ok: true }); } catch (error) { logError("api/api-keys/[id]/revoke.POST", error); return toErrorResponse(error); } }
