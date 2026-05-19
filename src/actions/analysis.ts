"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { newAnalysisSchema } from "@/domain/schemas/new-analysis";
import { step1Schema } from "@/domain/schemas/step1";
import { step2Schema } from "@/domain/schemas/step2";
import { step3Schema } from "@/domain/schemas/step3";
import { step4Schema } from "@/domain/schemas/step4";
import { step5Schema } from "@/domain/schemas/step5";
import { step6Schema } from "@/domain/schemas/step6";
import { step7Schema } from "@/domain/schemas/step7";
import { ok, err } from "@/domain/types/result";
import type { Result } from "@/domain/types/result";
import type { Json } from "@/lib/supabase/database.types";

// ---------------------------------------------------------------------------
// createAnalysisAction
// ---------------------------------------------------------------------------

/**
 * Creates a new analysis record and redirects to Step 1.
 *
 * @remarks
 * This action is the single entry point for creating a DB record. It is
 * only called after the user has provided a name on `/analysis/new`,
 * preventing orphan "empty" records if they abandon the name-prompt page.
 *
 * Security: Uses the anon Supabase client (cookie-based session). The
 * `analyses` table has a `user_id` RLS policy that restricts inserts
 * to the authenticated user's own rows. The service role key is never
 * used here. See ADR-002 (Supabase RLS).
 *
 * After a successful insert, `redirect()` is called, which throws a
 * Next.js `NEXT_REDIRECT` internal error — this is intentional and must
 * NOT be caught.
 *
 * See SPEC-WIZARD-START v1.0.0 AC-3.
 *
 * @param _prevState - unused; required by the `useActionState` contract
 * @param formData   - FormData from the name-prompt form
 * @returns never (redirects) | Result with error message
 */
export async function createAnalysisAction(
  _prevState: Result<never> | null,
  formData: FormData
): Promise<Result<never>> {
  // 1. Validate input
  const raw = { name: formData.get("name") };
  const parsed = newAnalysisSchema.safeParse(raw);

  if (!parsed.success) {
    return err<never>(
      parsed.error.issues.map((i) => i.message).join(", ")
    );
  }

  // 2. Authenticate
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return err<never>("Nicht authentifiziert. Bitte melde dich an.");
  }

  // 3. Insert (RLS enforces ownership)
  const { data: analysis, error: dbError } = await supabase
    .from("analyses")
    .insert({ name: parsed.data.name, user_id: user.id })
    .select("id")
    .single();

  if (dbError || !analysis) {
    return err<never>("Analyse konnte nicht gespeichert werden.");
  }

  // 4. Redirect — throws NEXT_REDIRECT internally; must not be caught
  redirect(`/analysis/${analysis.id}/step/1`);
}

// ---------------------------------------------------------------------------
// saveStepAction
// ---------------------------------------------------------------------------

/** Typed payload for step-save operations. */
export type SaveStepPayload = {
  analysisId: string;
  stepNumber: number;
  data: Record<string, unknown>;
};

/**
 * Upserts step data into `analysis_steps` and advances `current_step`.
 *
 * @remarks
 * Called on each wizard step's "Weiter" (next) button. Uses an upsert so
 * users can navigate back and re-submit without creating duplicate rows.
 *
 * Security: same authenticated Supabase client as `createAnalysisAction`.
 * The `analysis_steps` table has a foreign-key + RLS policy enforcing that
 * only the owner of the parent analysis can write step data.
 *
 * Does NOT redirect — that is the responsibility of the Client Component
 * step-form so it can also update the Zustand store before navigating.
 *
 * See SPEC-WIZARD-START v1.0.0 AC-5.
 *
 * @param payload - the step number, analysis ID, and raw step form data
 * @returns       - typed Result — client must check `success`
 */
export async function saveStepAction(
  payload: SaveStepPayload
): Promise<Result<{ currentStep: number }>> {
  const { analysisId, stepNumber, data } = payload;

  // 1. Validate step-specific schema
  if (stepNumber === 1) {
    const parsed = step1Schema.safeParse(data);
    if (!parsed.success) {
      return err(parsed.error.issues.map((i) => i.message).join(", "));
    }
  }

  if (stepNumber === 2) {
    const parsed = step2Schema.safeParse(data);
    if (!parsed.success) {
      return err(parsed.error.issues.map((i) => i.message).join(", "));
    }
  }

  if (stepNumber === 3) {
    const parsed = step3Schema.safeParse(data);
    if (!parsed.success) {
      return err(parsed.error.issues.map((i) => i.message).join(", "));
    }
  }
  if (stepNumber === 4) {
    const parsed = step4Schema.safeParse(data);
    if (!parsed.success) {
      return err(parsed.error.issues.map((i) => i.message).join(", "));
    }
  }
  
  if (stepNumber === 5) {
    const parsed = step5Schema.safeParse(data);
    if (!parsed.success) {
      return err(parsed.error.issues.map((i) => i.message).join(", "));
    }
  } else if (stepNumber === 6) {
    const parsed = step6Schema.safeParse(data);
    if (!parsed.success) {
      return err(parsed.error.issues.map((i) => i.message).join(", "));
    }
  } else if (stepNumber === 7) {
    const parsed = step7Schema.safeParse(data);
    if (!parsed.success) {
      return err(parsed.error.issues.map((i) => i.message).join(", "));
    }
  }

  // 2. Authenticate
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return err("Nicht authentifiziert.");
  }

  // 3. Verify ownership (defence-in-depth beyond RLS)
  const { data: analysis, error: ownerError } = await supabase
    .from("analyses")
    .select("id")
    .eq("id", analysisId)
    .eq("user_id", user.id)
    .single();

  if (ownerError || !analysis) {
    return err("Analyse nicht gefunden.");
  }

  // 4. Upsert step data — cast `data` to the Supabase Json type.
  // The Json union type in database.types.ts is recursive; `as Json` is the
  // canonical cast pattern for unknown JSONB payloads. Runtime structure is
  // validated by the step-specific Zod schema above.
  const { error: upsertError } = await supabase
    .from("analysis_steps")
    .upsert(
      { analysis_id: analysisId, step_number: stepNumber, data: data as unknown as Json },
      { onConflict: "analysis_id,step_number" }
    );

  if (upsertError) {
    return err("Schritt konnte nicht gespeichert werden.");
  }

  // 5. Advance current_step on the parent record if this step is latest
  const nextStep = stepNumber + 1;
  await supabase
    .from("analyses")
    .update({ current_step: nextStep })
    .eq("id", analysisId)
    .lt("current_step", nextStep); // only advance, never go back

  return ok({ currentStep: nextStep });
}

// ---------------------------------------------------------------------------
// deleteAnalysisAction
// ---------------------------------------------------------------------------

/**
 * Deletes an analysis record (and its cascade-deleted steps) by ID.
 *
 * @remarks
 * RLS on the `analyses` table ensures only the owner can delete their own
 * rows — the `.eq("user_id", user.id)` filter is defence-in-depth on top.
 *
 * Cascade deletion of `analysis_steps` is handled at the DB level via the
 * FK `ON DELETE CASCADE` constraint defined in `001_initial_schema.sql`.
 *
 * Returns `Result<void>` so the caller (Client Component) can show an inline
 * error without navigating away if the delete fails.
 *
 * See SPEC-PROJECT-LIST v1.0.0 §5 (delete flow).
 *
 * @param analysisId - UUID of the analysis to delete
 */
export async function deleteAnalysisAction(
  analysisId: string
): Promise<Result<void>> {
  if (!analysisId) {
    return err("Ungültige Analyse-ID.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return err("Nicht authentifiziert.");
  }

  const { error: dbError } = await supabase
    .from("analyses")
    .delete()
    .eq("id", analysisId)
    .eq("user_id", user.id); // RLS + defence-in-depth

  if (dbError) {
    return err("Analyse konnte nicht gelöscht werden.");
  }

  return ok(undefined);
}

