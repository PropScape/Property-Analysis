import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js middleware — refreshes Supabase auth session on every request.
 *
 * @remarks
 * Required by @supabase/ssr. Must run before any Server Component
 * that reads auth state. See src/lib/supabase/middleware.ts.
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
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
