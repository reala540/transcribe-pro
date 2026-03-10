import Link from "next/link";
import { prisma } from "@transcribe/db";
import { getCurrentUserRecord } from "@/lib/auth/get-current-user";
import { UploadProjectForm } from "@/components/upload-project-form";

export default async function ProjectsPage() {
  const user = await getCurrentUserRecord();
  const projects = await prisma.project.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  return <div className="space-y-8"><div><h1 className="text-3xl font-semibold tracking-tight">Projects</h1><p className="mt-2 text-zinc-400">Upload media and generate transcripts.</p></div><UploadProjectForm /><div className="space-y-3">{projects.length === 0 ? <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-400">No projects yet.</div> : projects.map((project) => <Link key={project.id} href={`/dashboard/projects/${project.id}`} className="block rounded-2xl border border-zinc-800 bg-zinc-900 p-5 transition hover:border-zinc-700"><div className="flex items-center justify-between gap-4"><div><h2 className="font-medium text-zinc-100">{project.title}</h2><p className="mt-1 text-sm text-zinc-400">{project.sourceFilename ?? "No file yet"}</p></div><span className="rounded-full border border-zinc-700 px-3 py-1 text-xs uppercase tracking-wide text-zinc-300">{project.status}</span></div></Link>)}</div></div>;
}
