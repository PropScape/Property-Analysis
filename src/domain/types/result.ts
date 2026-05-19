/**
 * Result pattern — the standard return type for all domain functions
 * and Server Actions.
 *
 * @remarks
 * Using a discriminated union instead of throwing exceptions ensures
 * that error handling is explicit and type-safe. Callers must check
 * `success` before accessing `data` or `error`.
 *
 * See ADR-004 (Clean Architecture) and docs/architecture.md §10.
 */
export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Creates a successful Result.
 *
 * @example
 * ```ts
 * return ok({ monthlyCashflowCents: 22400 });
 * ```
 */
export function ok<T>(data: T): Result<T> {
  return { success: true, data };
}

/**
 * Creates a failed Result.
 *
 * @example
 * ```ts
 * return err("Monthly rent must be a positive integer");
 * ```
 */
export function err<T>(error: string): Result<T> {
  return { success: false, error };
}
