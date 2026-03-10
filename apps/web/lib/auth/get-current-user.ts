import { prisma } from "@transcribe/db";
import { UnauthorizedError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUserRecord() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) throw new UnauthorizedError();
  return prisma.user.upsert({
    where: { email: user.email },
    update: { fullName: user.user_metadata?.full_name ?? undefined },
    create: { email: user.email, fullName: user.user_metadata?.full_name ?? undefined }
  });
}
