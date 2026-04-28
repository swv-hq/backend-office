/**
 * Threshold configuration for alert dispatcher rules. Adjust here once real
 * traffic patterns are observable; defaults are intentionally conservative for
 * a solo-dev deployment (BO-SPEC-006.AC6).
 */
export const FAILED_LOGIN_SPIKE = {
  count: 5,
  windowMs: 10 * 60 * 1000,
} as const;
