import { AppHeader } from "@/components/app-header";
import { ProjectOverviewContent } from "@/components/project-overview-content";
import { createClient } from "@/lib/supabase/server";
import type { AnalysisSummary } from "@/domain/types/analysis-summary";

/**
 * Project overview page — async Server Component.
 *
 * @remarks
 * Fetches the authenticated user's analyses (with location from step 2)
 * and passes them as a prop to `ProjectOverviewContent`. This keeps data
 * fetching in the Server Component layer (Clean Architecture: no direct
 * DB access from Client Components).
 *
 * The location field is a left-joined value from `analysis_steps` where
 * `step_number = 2`. Using a Postgres JSON path expression instead of a
 * separate round-trip query.
 *
 * Route is protected by `src/proxy.ts` (unauthenticated → /auth/login).
 * Implements SPEC-PROJECT-LIST v1.0.0.
 */
export default async function ProjectOverviewPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Proxy guarantees authentication, but we type-narrow defensively.
  const analyses: AnalysisSummary[] = [];

  if (user) {
    // Fetch all analyses for this user, most recently updated first.
    // We also fetch the step-2 location via a separate targeted query
    // (Supabase JS does not support JSON-path projections on related rows
    // in a single select call). Two lightweight queries are clearer and safer
    // than a raw SQL RPC for this early stage.
    const { data: rows } = await supabase
      .from("analyses")
      .select("id, name, status, current_step, created_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (rows && rows.length > 0) {
      // Batch-fetch step-2 data for location field (only rows that have it).
      const analysisIds = rows.map((r) => r.id);
      const { data: step2Rows } = await supabase
        .from("analysis_steps")
        .select("analysis_id, data")
        .in("analysis_id", analysisIds)
        .eq("step_number", 2);

      // Build a lookup map: analysisId → location string
      const locationMap = new Map<string, string>();
      if (step2Rows) {
        for (const step of step2Rows) {
          const stepData = step.data as Record<string, unknown> | null;
          if (stepData && typeof stepData["location"] === "string") {
            locationMap.set(step.analysis_id, stepData["location"]);
          }
        }
      }

      for (const row of rows) {
        analyses.push({
          id: row.id,
          name: row.name,
          status: row.status as "draft" | "completed",
          current_step: row.current_step,
          created_at: row.created_at,
          updated_at: row.updated_at,
          location: locationMap.get(row.id),
        });
      }
    }
  }

  return (
    <>
      <AppHeader />
      <ProjectOverviewContent initialAnalyses={analyses} />
    </>
  );
}
