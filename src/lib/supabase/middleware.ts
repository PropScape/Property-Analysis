import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Supabase middleware — refreshes user session on every request.
 *
 * @remarks
 * Must be called from `src/middleware.ts`. Ensures the session cookie
 * stays fresh so Server Components can read auth state correctly.
 *
 * See the @supabase/ssr docs for the full explanation of why this
 * middleware pattern is required with Next.js App Router.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session. Do not add any logic between createServerClient
  // and getUser — it can cause subtle auth bugs.
  await supabase.auth.getUser();

  return supabaseResponse;
}
