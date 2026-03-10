import { prisma } from "@transcribe/db";
import { CreateApiKeyForm } from "@/components/create-api-key-form";
import { getCurrentUserRecord } from "@/lib/auth/get-current-user";

export default async function ApiKeysPage() {
  const user = await getCurrentUserRecord();
  const apiKeys = await prisma.apiKey.findMany({ where: { userId: user.id, revokedAt: null }, orderBy: { createdAt: "desc" }, select: { id: true, label: true, keyPrefix: true, lastUsedAt: true, createdAt: true } });
  return <div className="space-y-6"><div><h1 className="text-3xl font-semibold tracking-tight">API Keys</h1><p className="mt-2 text-zinc-400">Create keys for scripts, automations, and integrations.</p></div><div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-300">Billing is disabled, so API access stays open for development. Keep keys private.</div><CreateApiKeyForm /><div className="space-y-3">{apiKeys.map((key) => <div key={key.id} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><div className="flex items-center justify-between gap-4"><div><h2 className="font-medium text-zinc-100">{key.label}</h2><p className="mt-1 text-sm text-zinc-400">{key.keyPrefix}••••••••</p><p className="mt-1 text-xs text-zinc-500">Created {new Date(key.createdAt).toLocaleString()}{key.lastUsedAt ? ` · Last used ${new Date(key.lastUsedAt).toLocaleString()}` : " · Never used"}</p></div><form action={`/api/api-keys/${key.id}/revoke`} method="post"><button className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-200">Revoke</button></form></div></div>)}</div></div>;
}
