import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function req(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(req("NEXT_PUBLIC_SUPABASE_URL"), req("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && (request.nextUrl.pathname.startsWith("/dashboard") || request.nextUrl.pathname.startsWith("/admin"))) {
    const url = request.nextUrl.clone(); url.pathname = "/login"; return NextResponse.redirect(url);
  }
  if (user && ["/login", "/signup"].includes(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone(); url.pathname = "/dashboard"; return NextResponse.redirect(url);
  }
  return response;
}
export const config = { matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/signup"] };
