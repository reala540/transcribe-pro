import { prisma } from "@transcribe/db";
import { hashApiKey } from "@/lib/api-keys";
import { getUserEntitlements } from "@/lib/billing/entitlements";
import { AppError } from "@/lib/errors";

export async function authenticateApiRequest(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  if (!token) return null;
  const keyHash = hashApiKey(token);
  const apiKey = await prisma.apiKey.findFirst({ where: { keyHash, revokedAt: null }, include: { user: true } });
  if (!apiKey) return null;
  const entitlements = await getUserEntitlements(apiKey.user.id, apiKey.user.plan);
  if (!entitlements.apiAccess) throw new AppError("API access is disabled for this account.", 403);
  await prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } });
  return apiKey.user;
}
