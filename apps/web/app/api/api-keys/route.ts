import { NextResponse } from "next/server";
import { prisma } from "@transcribe/db";
import { getCurrentUserRecord } from "@/lib/auth/get-current-user";
import { generateApiKey } from "@/lib/api-keys";
import { getUserEntitlements } from "@/lib/billing/entitlements";
import { AppError, logError, toErrorResponse } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { ApiKeyCreateSchema } from "@/lib/validation";
export async function GET() { try { const user = await getCurrentUserRecord(); const apiKeys = await prisma.apiKey.findMany({ where: { userId: user.id, revokedAt: null }, orderBy: { createdAt: "desc" }, select: { id: true, label: true, keyPrefix: true, lastUsedAt: true, createdAt: true } }); return NextResponse.json({ apiKeys }); } catch (error) { logError("api/api-keys.GET", error); return toErrorResponse(error); } }
export async function POST(request: Request) { try { const user = await getCurrentUserRecord(); const entitlements = await getUserEntitlements(user.id, user.plan); if (!entitlements.apiAccess) throw new AppError("API access is disabled for your account.", 403); const limiter = await rateLimit(`api-key:create:${user.id}`, 5, 60); if (!limiter.allowed) throw new AppError("Too many API keys created too quickly. Try again shortly.", 429); const parsed = ApiKeyCreateSchema.parse(await request.json()); const { rawKey, keyPrefix, keyHash } = generateApiKey(); const apiKey = await prisma.apiKey.create({ data: { userId: user.id, label: parsed.label?.trim() || "Default key", keyPrefix, keyHash }, select: { id: true, label: true, keyPrefix: true, createdAt: true } }); return NextResponse.json({ apiKey, rawKey }, { status: 201 }); } catch (error) { logError("api/api-keys.POST", error); return toErrorResponse(error); } }
