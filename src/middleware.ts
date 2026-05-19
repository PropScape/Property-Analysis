import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js edge middleware.
 *
 * @remarks
 * Two responsibilities:
 * 1. **Session refresh:** Calls `updateSession` from `@supabase/ssr` to keep
 *    the auth cookie fresh on every request. Required for Server Components
 *    to read auth state correctly.
 *
 * 2. **Pathname header:** Forwards `x-pathname` so Server Component layouts
 *    (which do not receive child route params) can read the current URL path
 *    and derive the active wizard step for the `WizardStepper`.
 *
 * @see {@link https://nextjs.org/docs/app/building-your-application/routing/middleware}
 */
export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  // Forward pathname so layout Server Components can read it via headers().
  // This is necessary because the wizard layout at /analysis/[id]/step/ does
  // not receive the [step] segment in its own params — only child pages do.
  response.headers.set("x-pathname", request.nextUrl.pathname);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
