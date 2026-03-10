import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
export default function LoginPage() { return <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6"><div className="w-full max-w-md"><h1 className="mb-2 text-3xl font-semibold">Welcome back</h1><p className="mb-8 text-zinc-400">Log in to manage transcripts and projects.</p><AuthForm mode="login" /><p className="mt-4 text-sm text-zinc-400">Don't have an account? <Link href="/signup" className="text-white">Create one</Link></p></div></main>; }
