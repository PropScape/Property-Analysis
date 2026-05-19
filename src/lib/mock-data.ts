/**
 * Mock data for the project overview page.
 *
 * @remarks
 * This file provides placeholder data while Supabase integration
 * is not yet implemented. Replace with server-side data fetching
 * once SPEC-AUTH and Supabase are connected.
 *
 * TODO: Remove this file after Supabase integration (SPEC-AUTH).
 */

/** Analysis status — matches the `status` column in the `analyses` table. */
export type AnalysisStatus = "draft" | "completed";

/** KPI snapshot shown on the analysis card (computed from step data). */
export interface KpiSnapshot {
  /** Total purchase price in integer cents */
  purchasePriceCents: number;
  /** Monthly cashflow (pre-tax) in integer cents */
  monthlyCashflowCents: number;
  /** Return on equity as a percentage (e.g. 16.5 = 16.5%) */
  returnOnEquityPercent: number;
}

/**
 * Summary representation of an analysis for the project list.
 *
 * @remarks
 * This is a projection — it does not contain the full step data.
 * It includes only the fields needed for the overview card display.
 */
export interface AnalysisSummary {
  id: string;
  name: string;
  status: AnalysisStatus;
  currentStep: number;
  /** Location description, derived from step 2 data */
  location?: string;
  /** KPI snapshot, populated only for completed analyses */
  kpiSnapshot?: KpiSnapshot;
  /** ISO 8601 timestamp */
  createdAt: string;
  /** ISO 8601 timestamp */
  updatedAt: string;
}

export const MOCK_ANALYSES: AnalysisSummary[] = [
  {
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    name: "Eigentumswohnung München Schwabing",
    status: "completed",
    currentStep: 16,
    location: "München, Schwabing",
    kpiSnapshot: {
      purchasePriceCents: 35000000,
      monthlyCashflowCents: 62000,
      returnOnEquityPercent: 16.5,
    },
    createdAt: "2026-05-01T10:00:00Z",
    updatedAt: "2026-05-15T14:30:00Z",
  },
  {
    id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    name: "Mehrfamilienhaus Berlin Mitte",
    status: "completed",
    currentStep: 16,
    location: "Berlin, Mitte",
    kpiSnapshot: {
      purchasePriceCents: 92000000,
      monthlyCashflowCents: -18500,
      returnOnEquityPercent: 4.2,
    },
    createdAt: "2026-04-20T08:00:00Z",
    updatedAt: "2026-05-12T09:15:00Z",
  },
  {
    id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
    name: "Altbauwohnung Hamburg Eppendorf",
    status: "draft",
    currentStep: 6,
    location: "Hamburg, Eppendorf",
    createdAt: "2026-05-10T16:00:00Z",
    updatedAt: "2026-05-18T11:45:00Z",
  },
];
