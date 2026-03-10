import { prisma } from "@transcribe/db";
import { BILLING_ENABLED, PLAN_LIMITS } from "@/lib/billing/config";

export async function getUserEntitlements(userId: string, plan: keyof typeof PLAN_LIMITS) {
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);
  const minuteEvents = await prisma.usageEvent.aggregate({
    where: { userId, type: "TRANSCRIPTION_MINUTES", createdAt: { gte: startOfMonth } },
    _sum: { value: true }
  });
  const usedMinutes = minuteEvents._sum.value ?? 0;
  const limits = PLAN_LIMITS[plan];
  return {
    plan,
    limits,
    usage: { usedMinutes, remainingMinutes: Math.max(0, limits.monthlyMinutes - usedMinutes) },
    canUpload: usedMinutes < limits.monthlyMinutes,
    exportsEnabled: limits.exportsEnabled,
    apiAccess: BILLING_ENABLED ? limits.apiAccess : true,
    priorityQueue: BILLING_ENABLED ? limits.priorityQueue : false
  };
}
