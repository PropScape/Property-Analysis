/**
 * Pure currency utility functions for the PropScape domain layer.
 *
 * @remarks
 * All monetary values in the domain are stored as **integer cents** to avoid
 * floating-point rounding errors. These helpers are the single authoritative
 * conversion points between cents and display strings.
 *
 * Rules:
 * - Never import from UI or store layers (dependency inversion).
 * - All functions are pure and side-effect-free.
 */

/**
 * Parses a German-locale EUR input string to integer cents.
 *
 * @example
 * parseToCents("350.000")     → 35_000_000
 * parseToCents("1.250,50")    → 125_050
 * parseToCents("")            → null
 * parseToCents("abc")         → null
 */
export function parseToCents(raw: string): number | null {
  // Remove German thousand-separators (.), replace comma decimal with dot
  const cleaned = raw.replace(/\./g, "").replace(",", ".").trim();
  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;
  return Math.round(num * 100);
}

/**
 * Formats integer cents to a German-locale number string **without** the
 * currency symbol, suitable for editable input fields.
 *
 * @example
 * formatCentsPlain(35_000_000) → "350.000"
 * formatCentsPlain(125_050)    → "1.251"  (rounded to nearest euro)
 */
export function formatCentsPlain(cents: number): string {
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(cents) / 100);
}

/**
 * Formats integer cents to a full German-locale EUR currency string.
 *
 * @example
 * formatCentsEur(35_000_000) → "350.000 €"
 * formatCentsEur(125_050)    → "1.251 €"
 */
export function formatCentsEur(cents: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(cents) / 100);
}

/**
 * Applies a percentage to an amount in cents, returning integer cents.
 *
 * @example
 * applyPercent(35_000_000, 3.57) → 1_249_500
 */
export function applyPercent(amountCents: number, percent: number): number {
  return Math.round(amountCents * (percent / 100));
}
