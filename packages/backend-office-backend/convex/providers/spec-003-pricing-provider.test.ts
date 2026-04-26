import { describe, it, expect, afterEach } from "vitest";
import type { PricingProvider } from "./pricing";
import { StubPricingProvider } from "./pricing-stub";
import { getPricingProvider } from "./index";

describe("BO-SPEC-003: Pricing Provider", () => {
  describe("PricingProvider interface [BO-SPEC-003.AC5]", () => {
    it("declares getMaterialPrices and getLaborRates", () => {
      const provider: PricingProvider = new StubPricingProvider();
      expect(typeof provider.getMaterialPrices).toBe("function");
      expect(typeof provider.getLaborRates).toBe("function");
    });
  });

  describe("StubPricingProvider", () => {
    const provider = new StubPricingProvider();

    it("returns an empty material list for any trade and zip", async () => {
      const out = await provider.getMaterialPrices({
        trade: "plumber",
        zipCode: "94110",
      });
      expect(out).toEqual({ materials: [], source: "stub" });
    });

    it("returns null labor rates for any trade and zip", async () => {
      const out = await provider.getLaborRates({
        trade: "electrician",
        zipCode: "10001",
      });
      expect(out).toEqual({ hourlyRate: null, source: "stub" });
    });
  });

  describe("Provider registry [BO-SPEC-003.AC10]", () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it("returns the StubPricingProvider when PRICING_PROVIDER is unset", () => {
      delete process.env.PRICING_PROVIDER;
      const provider = getPricingProvider();
      expect(provider).toBeInstanceOf(StubPricingProvider);
    });

    it("returns the StubPricingProvider when PRICING_PROVIDER=stub", () => {
      process.env.PRICING_PROVIDER = "stub";
      const provider = getPricingProvider();
      expect(provider).toBeInstanceOf(StubPricingProvider);
    });

    it("throws on an unknown PRICING_PROVIDER value", () => {
      process.env.PRICING_PROVIDER = "vendorX";
      expect(() => getPricingProvider()).toThrow(/PRICING_PROVIDER/);
    });
  });
});
