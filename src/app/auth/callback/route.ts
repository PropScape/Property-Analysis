import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Supabase PKCE auth callback handler.
 *
 * @remarks
 * Supabase redirects here after email confirmation or OAuth flows.
 * Exchanges the one-time `code` query param for a session cookie,
 * then redirects the user to the app.
 *
 * See SPEC-AUTH v1.0.0 §4.2 and the @supabase/ssr PKCE docs.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Code missing or exchange failed — redirect to login with error param
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`);
}
