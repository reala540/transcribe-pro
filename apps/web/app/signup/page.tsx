import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
export default function SignupPage() { return <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6"><div className="w-full max-w-md"><h1 className="mb-2 text-3xl font-semibold">Create your account</h1><p className="mb-8 text-zinc-400">Start your transcription workspace.</p><AuthForm mode="signup" /><p className="mt-4 text-sm text-zinc-400">Already have an account? <Link href="/login" className="text-white">Log in</Link></p></div></main>; }
