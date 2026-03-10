export const BILLING_ENABLED = false;
export const PLAN_LIMITS = {
  FREE: { monthlyMinutes: 10000, maxUploadSizeMb: 500, exportsEnabled: true, apiAccess: true, priorityQueue: false },
  PRO: { monthlyMinutes: 50000, maxUploadSizeMb: 2000, exportsEnabled: true, apiAccess: true, priorityQueue: true },
  BUSINESS: { monthlyMinutes: 250000, maxUploadSizeMb: 5000, exportsEnabled: true, apiAccess: true, priorityQueue: true }
} as const;
