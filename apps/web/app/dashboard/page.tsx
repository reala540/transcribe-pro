import { prisma } from "@transcribe/db";
import { getCurrentUserRecord } from "@/lib/auth/get-current-user";
import { getUserEntitlements } from "@/lib/billing/entitlements";

export default async function DashboardPage() {
  const user = await getCurrentUserRecord();
  const entitlements = await getUserEntitlements(user.id, user.plan);
  const [projectCount, completedCount] = await Promise.all([
    prisma.project.count({ where: { userId: user.id } }),
    prisma.project.count({ where: { userId: user.id, status: "COMPLETED" } })
  ]);

  return <div className="space-y-6"><div><h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1><p className="mt-2 text-zinc-400">Signed in as {user.email}</p></div><div className="grid gap-4 md:grid-cols-4"><div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Projects</p><p className="mt-3 text-3xl font-semibold">{projectCount}</p></div><div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Completed transcripts</p><p className="mt-3 text-3xl font-semibold">{completedCount}</p></div><div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Minutes used this month</p><p className="mt-3 text-3xl font-semibold">{entitlements.usage.usedMinutes}</p></div><div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Plan</p><p className="mt-3 text-3xl font-semibold">Free</p></div></div><div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-zinc-300">Free access is enabled right now. Billing is not active yet.</div></div>;
}
