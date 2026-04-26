export type TradeType = "handyman" | "plumber" | "electrician";

export interface AddressInput {
  street: string;
  unit?: string;
  city: string;
  state: string;
  zip: string;
}

export interface EstimateLineItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  type: "material" | "labor" | "other" | string;
}
