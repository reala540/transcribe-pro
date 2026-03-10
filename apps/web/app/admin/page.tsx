import { redirect } from "next/navigation";
import { prisma } from "@transcribe/db";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAdmin(user?.email)) redirect("/dashboard");
  const [users, projects, completedProjects, usage] = await Promise.all([prisma.user.count(), prisma.project.count(), prisma.project.count({ where: { status: "COMPLETED" } }), prisma.usageEvent.aggregate({ where: { type: "TRANSCRIPTION_MINUTES" }, _sum: { value: true } })]);
  return <div className="space-y-6 px-6 py-10 text-zinc-100"><div><h1 className="text-3xl font-semibold tracking-tight">Admin</h1><p className="mt-2 text-zinc-400">Internal product metrics</p></div><div className="grid gap-4 md:grid-cols-4"><div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Users</p><p className="mt-3 text-3xl font-semibold">{users}</p></div><div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Projects</p><p className="mt-3 text-3xl font-semibold">{projects}</p></div><div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Completed</p><p className="mt-3 text-3xl font-semibold">{completedProjects}</p></div><div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Minutes processed</p><p className="mt-3 text-3xl font-semibold">{usage._sum.value ?? 0}</p></div></div></div>;
}
