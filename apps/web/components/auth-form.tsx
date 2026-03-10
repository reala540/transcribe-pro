"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { AuthFormSchema } from "@/lib/validation";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setError(null); setMessage(null);
    try {
      const parsed = AuthFormSchema.safeParse({ email, password });
      if (!parsed.success) { setError(parsed.error.errors[0]?.message ?? "Invalid credentials."); return; }
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) throw error;
        router.push("/dashboard"); router.refresh(); return;
      }
      const { data, error } = await supabase.auth.signUp({ email: parsed.data.email, password: parsed.data.password, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
      if (error) throw error;
      if (data.session) { router.push("/dashboard"); router.refresh(); return; }
      setMessage("Account created. Check your email to confirm your address before logging in.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally { setLoading(false); }
  }

  return <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><div><label className="mb-2 block text-sm text-zinc-300">Email</label><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-500" required /></div><div><label className="mb-2 block text-sm text-zinc-300">Password</label><input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-500" minLength={8} required /><p className="mt-2 text-xs text-zinc-500">Use at least 8 characters.</p></div>{error ? <p className="text-sm text-red-400">{error}</p> : null}{message ? <p className="text-sm text-emerald-400">{message}</p> : null}<button type="submit" disabled={loading} className="w-full rounded-xl bg-white px-4 py-3 font-medium text-black transition hover:opacity-90 disabled:opacity-50">{loading ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}</button></form>;
}
