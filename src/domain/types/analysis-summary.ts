/**
 * Domain type for an analysis summary as shown in the project overview list.
 *
 * @remarks
 * This replaces the old `AnalysisSummary` from `src/lib/mock-data.ts`.
 * It is a projection — not the full step data. Contains only the fields
 * needed for the overview card. KPI fields (purchase price, cashflow, ROE)
 * are only populated for completed analyses (steps 3 and 7 respectively).
 *
 * `location` is denormalised from `analysis_steps.step_data` (step 2).
 *
 * See SPEC-PROJECT-LIST v1.0.0 §3 (data model) and `docs/architecture.md §3.2`.
 */
export interface AnalysisSummary {
  id: string;
  name: string;
  /** DB enum: "draft" | "completed" */
  status: "draft" | "completed";
  /** Most recently reached wizard step (1–16). */
  current_step: number;
  /** ISO-8601 creation timestamp from the DB. */
  created_at: string;
  /** ISO-8601 last-update timestamp from the DB. */
  updated_at: string;
  /**
   * Free-text location derived from step 2 `step_data.location`.
   * `undefined` if step 2 has not been completed yet.
   */
  location?: string;
}
