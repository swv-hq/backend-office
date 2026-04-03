import { v } from "convex/values";

export const addressValidator = v.object({
  street: v.string(),
  unit: v.optional(v.string()),
  city: v.string(),
  state: v.string(),
  zip: v.string(),
});

export const lineItemValidator = v.object({
  description: v.string(),
  quantity: v.number(),
  unit: v.string(),
  unitPrice: v.number(),
  total: v.number(),
  type: v.string(),
});
