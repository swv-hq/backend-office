import type {
  LaborRateQuery,
  LaborRateResult,
  MaterialPriceQuery,
  MaterialPricesResult,
  PricingProvider,
} from "./pricing";

// Stub implementation that returns empty results until an external pricing
// vendor is selected. Callers should fall back to the AI provider for pricing
// suggestions in the meantime (see BO-SPEC-003 Resolved Decisions).
export class StubPricingProvider implements PricingProvider {
  async getMaterialPrices(
    query: MaterialPriceQuery,
  ): Promise<MaterialPricesResult> {
    void query;
    return { materials: [], source: "stub" };
  }

  async getLaborRates(query: LaborRateQuery): Promise<LaborRateResult> {
    void query;
    return { hourlyRate: null, source: "stub" };
  }
}
