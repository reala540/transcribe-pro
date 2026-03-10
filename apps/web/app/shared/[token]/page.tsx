import { notFound } from "next/navigation";
import { prisma } from "@transcribe/db";

function formatMs(ms: number) { const totalSeconds = Math.floor(ms / 1000); const minutes = Math.floor(totalSeconds / 60); const seconds = totalSeconds % 60; return `${minutes}:${seconds.toString().padStart(2, "0")}`; }

export default async function SharedTranscriptPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const shared = await prisma.sharedProjectLink.findFirst({ where: { token, revokedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }, include: { project: { include: { segments: { orderBy: { orderIndex: "asc" } } } } } });
  if (!shared || shared.project.status !== "COMPLETED") notFound();
  return <main className="mx-auto max-w-4xl px-6 py-12 text-zinc-100"><h1 className="text-4xl font-semibold tracking-tight">{shared.project.title}</h1><p className="mt-3 text-zinc-400">Shared transcript view</p><div className="mt-8 space-y-4">{shared.project.segments.map((segment) => <div key={segment.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"><div className="mb-2 text-xs uppercase tracking-wide text-zinc-500">{formatMs(segment.startMs)} {segment.speaker ? `· ${segment.speaker}` : ""}</div><p className="leading-7 text-zinc-200">{segment.text}</p></div>)}</div></main>;
}
