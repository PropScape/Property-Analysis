import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Supabase browser client — for use in Client Components only.
 *
 * @remarks
 * Uses the public anon key. Row Level Security (RLS) enforces access
 * control; this key has no elevated privileges.
 *
 * See ADR-002 (Supabase) for the rationale on client strategy.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
