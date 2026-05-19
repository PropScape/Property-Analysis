import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Supabase server client — for use in Server Components and Server Actions.
 *
 * @remarks
 * Uses the anon key + cookie-based session. Must be called inside a
 * Server Component, Route Handler, or Server Action (not at module scope).
 *
 * The service role client (bypass-RLS) is NOT exposed here — it lives
 * separately and is only used in trusted server-side migration scripts.
 *
 * See ADR-002 (Supabase) for the rationale.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll can be called from a Server Component where cookies
            // are read-only. Middleware handles session refresh in that case.
          }
        },
      },
    }
  );
}
