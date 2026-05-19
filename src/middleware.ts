import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

/** Auth routes that are always publicly accessible (no redirect when authed). */
const AUTH_PUBLIC_BYPASS = ["/auth/callback", "/auth/verify-email"];

/**
 * Next.js middleware — session refresh + route protection.
 *
 * @remarks
 * 1. Refreshes the Supabase session cookie on every request (required by @supabase/ssr).
 * 2. Redirects unauthenticated users away from protected routes to /auth/login.
 * 3. Redirects authenticated users away from /auth/login and /auth/register to /.
 *
 * See SPEC-AUTH v1.0.0 §4.5.
 */
export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Read the session from the refreshed response cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {
          // Cookie mutation already handled by updateSession above
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute = pathname.startsWith("/auth/");
  const isBypassRoute = AUTH_PUBLIC_BYPASS.some((p) => pathname.startsWith(p));

  // Unauthenticated on a protected route → redirect to login
  if (!user && !isAuthRoute) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Authenticated on login/register → redirect to app
  if (user && isAuthRoute && !isBypassRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT static files and images.
     * See: https://nextjs.org/docs/app/building-your-application/routing/middleware
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

