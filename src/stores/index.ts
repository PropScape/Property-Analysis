/**
 * Store barrel — re-exports all Zustand stores.
 *
 * @remarks
 * Import stores from this file to keep import paths stable as the store
 * count grows.
 *
 * Example:
 * ```ts
 * import { useAnalysisStore } from "@/stores";
 * ```
 *
 * See ADR-005 (Zustand) for the store architecture rationale.
 */
export { useAnalysisStore } from "./analysis-store";
export type { AnalysisStore } from "./analysis-store";

