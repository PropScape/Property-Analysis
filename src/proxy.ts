import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

/** Auth routes that are always publicly accessible (no redirect when authed). */
const AUTH_PUBLIC_BYPASS = ["/auth/callback", "/auth/verify-email"];

/**
 * Next.js proxy — session refresh, route protection, and pathname header.
 *
 * @remarks
 * 1. Refreshes the Supabase session cookie on every request (required by @supabase/ssr).
 * 2. Redirects unauthenticated users away from protected routes to /auth/login.
 * 3. Redirects authenticated users away from /auth/login and /auth/register to /.
 * 4. Sets `x-pathname` response header so Server Component layouts can read
 *    the current URL path (e.g. to derive the active wizard step).
 *
 * ⚠️  THIS IS THE ONLY EDGE-REQUEST FILE IN THIS PROJECT.
 * Next.js 16 uses `proxy.ts` — NOT `middleware.ts` (deprecated).
 * Never create `src/middleware.ts`. See ADR-007 for details.
 *
 * Renamed from `middleware` to `proxy` as per Next.js 16 convention.
 * See SPEC-AUTH v1.0.0 §4.5 and ADR-007.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Inject x-pathname into the forwarded request headers BEFORE NextResponse.next
  // so Server Component layouts can read it via headers() from next/headers.
  // Setting it on the *response* headers does NOT work — headers() only reads
  // headers that were forwarded with the request. See ADR-007.
  const response = await updateSession(request, { "x-pathname": pathname });

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

  // Forward pathname so Server Component layouts can read the active route
  // without needing child-segment params (e.g. WizardLayout needs [step]).
  // NOTE: this is handled via additionalRequestHeaders in updateSession above —
  // NOT here, because response headers are not accessible via headers().

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

