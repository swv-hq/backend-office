import type { TradeType } from "./types";

export interface MaterialPriceQuery {
  trade: TradeType;
  zipCode: string;
}

export interface MaterialPrice {
  name: string;
  unit: string;
  unitPrice: number;
}

export interface MaterialPricesResult {
  materials: MaterialPrice[];
  source: string;
}

export interface LaborRateQuery {
  trade: TradeType;
  zipCode: string;
}

export interface LaborRateResult {
  hourlyRate: number | null;
  source: string;
}

export interface PricingProvider {
  getMaterialPrices(query: MaterialPriceQuery): Promise<MaterialPricesResult>;
  getLaborRates(query: LaborRateQuery): Promise<LaborRateResult>;
}
