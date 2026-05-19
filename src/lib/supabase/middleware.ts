import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Supabase middleware — refreshes user session on every request.
 *
 * @remarks
 * Must be called from `src/proxy.ts`. Ensures the session cookie
 * stays fresh so Server Components can read auth state correctly.
 *
 * Accepts `additionalRequestHeaders` that will be merged into the
 * forwarded request headers (available to Server Components via
 * `headers()` from `next/headers`). This is the only correct way to
 * inject custom headers that Server Components can read — setting them
 * on the *response* headers does NOT make them available via `headers()`.
 *
 * See the @supabase/ssr docs for the full explanation of why this
 * middleware pattern is required with Next.js App Router.
 *
 * @see {@link https://nextjs.org/docs/app/api-reference/functions/headers}
 */
export async function updateSession(
  request: NextRequest,
  additionalRequestHeaders?: Record<string, string>
) {
  // Merge any extra headers the caller wants to forward to Server Components.
  const requestHeaders = new Headers(request.headers);
  if (additionalRequestHeaders) {
    Object.entries(additionalRequestHeaders).forEach(([key, value]) => {
      requestHeaders.set(key, value);
    });
  }

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });

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
          // Use requestHeaders (not bare `request`) so custom headers like
          // x-pathname are preserved even when Supabase refreshes the cookie.
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
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
