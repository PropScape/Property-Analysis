import { describe, it, expect } from "vitest";
import {
  BUNDESLAND_TAX_RATES,
  computeAncillaryCosts,
} from "@/domain/calculations/acquisition-costs";

const BASE = {
  purchasePriceCents: 35_000_000, // 350 000 €
  brokerFeePercent: 3.57,
  notaryFeePercent: 1.5,
  landRegistryFeePercent: 0.5,
  bundesland: "NW" as const,
  customItems: [],
};

describe("BUNDESLAND_TAX_RATES", () => {
  it("has exactly 16 entries", () => {
    expect(Object.keys(BUNDESLAND_TAX_RATES)).toHaveLength(16);
  });

  it("Bayern has the lowest rate (3.5%)", () => {
    expect(BUNDESLAND_TAX_RATES.BY).toBe(3.5);
  });

  it("NRW has rate 6.5%", () => {
    expect(BUNDESLAND_TAX_RATES.NW).toBe(6.5);
  });

  it("all rates are positive numbers", () => {
    for (const rate of Object.values(BUNDESLAND_TAX_RATES)) {
      expect(rate).toBeGreaterThan(0);
    }
  });
});

describe("computeAncillaryCosts", () => {
  it("computes broker fee in cents", () => {
    const { brokerCents } = computeAncillaryCosts(
      BASE.purchasePriceCents, BASE.brokerFeePercent, 0, 0, "BY", []
    );
    // 350 000 × 3.57% = 12 495 € = 1 249 500 ct
    expect(brokerCents).toBe(1_249_500);
  });

  it("resolves transfer tax percent from Bundesland", () => {
    const { transferTaxPercent } = computeAncillaryCosts(
      BASE.purchasePriceCents, 0, 0, 0, "NW", []
    );
    expect(transferTaxPercent).toBe(6.5);
  });

  it("sums custom items correctly", () => {
    const items = [
      { label: "Gutachter", amount_cents: 50_000 },
      { label: "Sonstiges", amount_cents: 30_000 },
    ];
    const { customTotalCents } = computeAncillaryCosts(
      BASE.purchasePriceCents, 0, 0, 0, "BY", items
    );
    expect(customTotalCents).toBe(80_000);
  });

  it("excludes custom items with 0 amount", () => {
    const items = [
      { label: "Leer", amount_cents: 0 },
      { label: "Gültig", amount_cents: 10_000 },
    ];
    const { customTotalCents } = computeAncillaryCosts(
      BASE.purchasePriceCents, 0, 0, 0, "BY", items
    );
    expect(customTotalCents).toBe(10_000);
  });

  it("computes totalInvestmentCents as price + ancillary", () => {
    const result = computeAncillaryCosts(
      BASE.purchasePriceCents,
      BASE.brokerFeePercent,
      BASE.notaryFeePercent,
      BASE.landRegistryFeePercent,
      BASE.bundesland,
      BASE.customItems
    );
    expect(result.totalInvestmentCents).toBe(
      BASE.purchasePriceCents + result.totalAncillaryCents
    );
  });

  it("returns 0 ancillaryRatePercent when purchase price is 0", () => {
    const { ancillaryRatePercent } = computeAncillaryCosts(0, 3.57, 1.5, 0.5, "NW", []);
    expect(ancillaryRatePercent).toBe(0);
  });

  it("ancillaryRatePercent ≈ sum of all input percentages for zero custom items", () => {
    const { ancillaryRatePercent } = computeAncillaryCosts(
      35_000_000, 3.57, 1.5, 0.5, "NW", []
    );
    // NW = 6.5%, so total = 3.57 + 1.5 + 0.5 + 6.5 = 12.07%
    expect(ancillaryRatePercent).toBeCloseTo(12.07, 1);
  });
});
