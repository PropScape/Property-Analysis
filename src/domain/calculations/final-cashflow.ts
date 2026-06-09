/**
 * Pure calculation functions for Step 13 — Final Cashflow & KPIs.
 *
 * @remarks
 * No UI, store, or Next.js imports. All inputs/outputs use integer cents.
 * Follows ADR-004 (framework-free domain layer).
 *
 * Algorithm overview:
 * 1. Monthly debt service via German Annuity formula (reused from Step 6 logic).
 * 2. Pre-tax cashflow = coldRent − ownerCosts − nonRecoverable − debtService.
 * 3. Tax refund = max(0, −taxableIncome) × effectiveTaxRate (AfA + interest shield).
 * 4. After-tax cashflow = pre-tax + taxRefund / 12.
 * 5. 10-year projection: rent grows 1% p.a., AfA benefit constant, interest
 *    deduction declines as the loan amortises at the initial rate.
 *
 * See SPEC-WIZARD-STEP13 v1.0.0.
 */

import type {
  FinalCashflowInputs,
  FinalCashflowSummary,
  ProjectionYear,
  StressScenario,
  StressStatus,
} from "@/domain/types/wizard";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * German annuity monthly payment (Annuitätendarlehen).
 *
 * @param loanCents - Loan principal in cents.
 * @param interestPct - Annual interest rate in percent (e.g. 3.8).
 * @param repaymentPct - Initial annual repayment rate in percent (e.g. 2.0).
 * @returns Monthly payment in cents (rounded).
 */
function monthlyAnnuity(
  loanCents: number,
  interestPct: number,
  repaymentPct: number
): number {
  const combinedRate = (interestPct + repaymentPct) / 100;
  return Math.round((loanCents * combinedRate) / 12);
}

/**
 * Classifies a monthly cashflow value into a traffic-light stress status.
 *
 * @param monthCents - Monthly cashflow in cents.
 * @returns `"ok"` | `"risk"` | `"critical"`
 */
function classifyStress(monthCents: number): StressStatus {
  if (monthCents > 0) return "ok";
  if (monthCents >= -10000) return "risk"; // ≥ −100 €
  return "critical";
}

// ---------------------------------------------------------------------------
// computeFinalCashflow
// ---------------------------------------------------------------------------

/**
 * Computes the full KPI summary for the Step 13 results screen.
 *
 * @param inputs - All required inputs from prior wizard steps.
 * @returns A `FinalCashflowSummary` value object. Never throws — all monetary
 *   arithmetic is clamped and rounded to integer cents.
 *
 * @remarks
 * **Tax refund model:**
 * German rental property investors can deduct AfA, loan interest, and
 * Werbungskosten from their rental income, creating a "paper loss" that
 * reduces their personal income tax. When taxable rental income is negative,
 * the absolute value × effective tax rate equals the annual tax refund.
 * This model is conservative — it does not account for Verlustvorträge or
 * cross-income netting.
 *
 * **10-year projection:**
 * - Cold rent grows by 1 % p.a. (German market convention for long-term leases).
 * - AfA deduction stays constant (straight-line depreciation).
 * - Loan interest deduction declines as the loan amortises at the initial
 *   combined rate (simplified: reduces by `repaymentRate × loanAmount / 12`
 *   per month in annuity amortisation).
 * - Owner costs and non-recoverable costs grow by 0.5 % p.a. (inflation proxy).
 */
export function computeFinalCashflow(
  inputs: FinalCashflowInputs
): FinalCashflowSummary {
  const {
    purchasePriceCents,
    coldRentCents,
    vacancyRatePercent,
    equityCents,
    loanAmountCents,
    interestRatePercent,
    repaymentRatePercent,
    monthlyOwnerCostsCents,
    effectiveTaxRatePercent,
    annualDepreciationCents,
    nonRecoverableCostsPerMonthCents,
    specialDeductionsTotalCents,
    appreciationRatePercent,
  } = inputs;

  // ── Step 1: Monthly debt service ──────────────────────────────────────────
  const monthlyDebtService = monthlyAnnuity(
    loanAmountCents,
    interestRatePercent,
    repaymentRatePercent
  );

  // ── Step 2: Effective cold rent (vacancy-adjusted) ────────────────────────
  const effectiveColdRentCents = Math.round(
    coldRentCents * (1 - vacancyRatePercent / 100)
  );

  // ── Step 3: Pre-tax cashflow ───────────────────────────────────────────────
  const preTaxMonthCents =
    effectiveColdRentCents -
    monthlyOwnerCostsCents -
    nonRecoverableCostsPerMonthCents -
    monthlyDebtService;
  const preTaxAnnualCents = preTaxMonthCents * 12;

  // ── Step 4: Taxable rental income ─────────────────────────────────────────
  const annualInterestCents = Math.round(
    (loanAmountCents * interestRatePercent) / 100
  );
  const taxableIncomeCents =
    effectiveColdRentCents * 12 -
    annualDepreciationCents -
    annualInterestCents -
    specialDeductionsTotalCents -
    nonRecoverableCostsPerMonthCents * 12;

  // ── Step 5: Tax refund (clamped to ≥ 0) ───────────────────────────────────
  const taxRefundAnnualCents = Math.max(
    0,
    Math.round((-taxableIncomeCents) * (effectiveTaxRatePercent / 100))
  );

  // ── Step 6: After-tax cashflow ────────────────────────────────────────────
  const afterTaxMonthCents =
    preTaxMonthCents + Math.round(taxRefundAnnualCents / 12);
  const afterTaxAnnualCents = afterTaxMonthCents * 12;

  // ── Step 7: Yield & ROE ───────────────────────────────────────────────────
  const grossYieldPercent =
    purchasePriceCents > 0
      ? (coldRentCents * 12 * 100) / purchasePriceCents
      : 0;

  const safeEquity = Math.max(1, equityCents); // guard against division by zero
  const roePercent = (afterTaxAnnualCents / safeEquity) * 100;

  // ── Step 8: Wealth building ───────────────────────────────────────────────
  const annualRepaymentCents = Math.round(
    (loanAmountCents * repaymentRatePercent) / 100
  );
  const appreciationAnnualCents = Math.round(
    (purchasePriceCents * appreciationRatePercent) / 100
  );
  const totalReturnYear1Cents =
    afterTaxAnnualCents + annualRepaymentCents + appreciationAnnualCents;

  // ── Step 9: 10-year projection ────────────────────────────────────────────
  const projectionYears: ProjectionYear[] = [];
  let runningLoanCents = loanAmountCents;

  for (let yr = 1; yr <= 10; yr++) {
    // Rent grows 1 % p.a.
    const growthFactor = Math.pow(1.01, yr - 1);
    const yearColdRentCents = Math.round(effectiveColdRentCents * growthFactor);
    // Owner costs grow 0.5 % p.a. (inflation proxy)
    const costGrowth = Math.pow(1.005, yr - 1);
    const yearOwnerCostsCents = Math.round(monthlyOwnerCostsCents * costGrowth);
    const yearNonRecoverableCents = Math.round(
      nonRecoverableCostsPerMonthCents * costGrowth
    );

    // Interest portion of annuity payment for this year
    const yearInterestCents = Math.round(
      (runningLoanCents * interestRatePercent) / 100
    );

    // Amortise loan: subtract principal repayment for this year
    const annualPaymentCents = Math.round(
      runningLoanCents * ((interestRatePercent + repaymentRatePercent) / 100)
    );
    const principalCents = Math.max(0, annualPaymentCents - yearInterestCents);
    runningLoanCents = Math.max(0, runningLoanCents - principalCents);

    const monthlyDebtSvcYr = Math.round(annualPaymentCents / 12);

    // Pre-tax cashflow for this year
    const yearPreTaxMonthCents =
      yearColdRentCents - yearOwnerCostsCents - yearNonRecoverableCents - monthlyDebtSvcYr;
    const yearPreTaxAnnualCents = yearPreTaxMonthCents * 12;

    // Taxable income for this year
    const yearTaxableIncomeCents =
      yearColdRentCents * 12 -
      annualDepreciationCents -
      yearInterestCents -
      specialDeductionsTotalCents -
      yearNonRecoverableCents * 12;

    const yearTaxRefundCents = Math.max(
      0,
      Math.round((-yearTaxableIncomeCents) * (effectiveTaxRatePercent / 100))
    );

    const yearAfterTaxAnnualCents =
      yearPreTaxAnnualCents + yearTaxRefundCents;

    projectionYears.push({
      year: yr,
      preTaxCents: yearPreTaxAnnualCents,
      afterTaxCents: yearAfterTaxAnnualCents,
    });
  }

  // ── Step 10: Investment status badge ──────────────────────────────────────
  let investmentStatus: FinalCashflowSummary["investmentStatus"];
  if (afterTaxMonthCents > 0) {
    investmentStatus = "positiv";
  } else if (afterTaxMonthCents >= -5000) {
    // ≥ −50 €
    investmentStatus = "neutral";
  } else {
    investmentStatus = "negativ";
  }

  return {
    preTaxMonthCents,
    preTaxAnnualCents,
    taxRefundAnnualCents,
    afterTaxMonthCents,
    afterTaxAnnualCents,
    equityRequiredCents: equityCents,
    grossYieldPercent: Math.round(grossYieldPercent * 100) / 100,
    roePercent: Math.round(roePercent * 100) / 100,
    annualRepaymentCents,
    appreciationAnnualCents,
    totalReturnYear1Cents,
    projectionYears,
    investmentStatus,
  };
}

// ---------------------------------------------------------------------------
// computeStressScenarios
// ---------------------------------------------------------------------------

/**
 * Computes three pre-defined adverse stress scenarios against a baseline summary.
 *
 * @param baseline - The nominal `FinalCashflowSummary` (from `computeFinalCashflow`).
 * @param inputs - Original inputs (required to re-run calculations with modified params).
 * @param stressVacancyPct - Target vacancy rate for scenario 1 (e.g. 10.0).
 * @param stressInterestDeltaPp - Interest rate increase in pp for scenario 2 (e.g. 2.0).
 * @param stressMaintenanceCents - One-off maintenance cost in cents for scenario 3.
 * @returns Three `StressScenario` objects in order: vacancy, interest, maintenance.
 */
export function computeStressScenarios(
  baseline: FinalCashflowSummary,
  inputs: FinalCashflowInputs,
  stressVacancyPct: number,
  stressInterestDeltaPp: number,
  stressMaintenanceCents: number
): StressScenario[] {
  const baseMonthCents = baseline.afterTaxMonthCents;

  // ── Scenario 1: Mietausfallwagnis ─────────────────────────────────────────
  const vacancyInputs: FinalCashflowInputs = {
    ...inputs,
    vacancyRatePercent: stressVacancyPct,
  };
  const vacancySummary = computeFinalCashflow(vacancyInputs);
  const vacancyMonthCents = vacancySummary.afterTaxMonthCents;

  // ── Scenario 2: Zinsänderungsrisiko ───────────────────────────────────────
  const interestInputs: FinalCashflowInputs = {
    ...inputs,
    interestRatePercent: inputs.interestRatePercent + stressInterestDeltaPp,
  };
  const interestSummary = computeFinalCashflow(interestInputs);
  const interestMonthCents = interestSummary.afterTaxMonthCents;

  // ── Scenario 3: Unerwartete Instandhaltung ────────────────────────────────
  // Distribute the one-off cost evenly over 12 months for monthly impact.
  const maintenanceMonthlyImpactCents = Math.round(stressMaintenanceCents / 12);
  const maintenanceMonthCents = baseMonthCents - maintenanceMonthlyImpactCents;

  return [
    {
      id: "vacancy",
      title: "Mietausfallwagnis steigt",
      description: `Von ${inputs.vacancyRatePercent}% auf ${stressVacancyPct}% (Leerstand)`,
      cashflowMonthCents: vacancyMonthCents,
      deltaCents: vacancyMonthCents - baseMonthCents,
      status: classifyStress(vacancyMonthCents),
    },
    {
      id: "interest",
      title: "Zinsänderungsrisiko (Anschlussfinanzierung)",
      description: `Zins steigt auf ${(inputs.interestRatePercent + stressInterestDeltaPp).toFixed(1).replace(".", ",")}%`,
      cashflowMonthCents: interestMonthCents,
      deltaCents: interestMonthCents - baseMonthCents,
      status: classifyStress(interestMonthCents),
    },
    {
      id: "maintenance",
      title: "Unerwartete Instandhaltung",
      description: `+ ${Math.round(stressMaintenanceCents / 100).toLocaleString("de-DE")} € Einmalkosten (J1)`,
      cashflowMonthCents: maintenanceMonthCents,
      deltaCents: -maintenanceMonthlyImpactCents,
      status: classifyStress(maintenanceMonthCents),
    },
  ];
}
