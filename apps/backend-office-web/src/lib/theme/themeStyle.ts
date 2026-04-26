import { getTheme, type TradeType } from "@backend-office/backend/themes";

export const CUSTOMER_THEME_VAR = {
  primary: "--bo-color-primary",
  secondary: "--bo-color-secondary",
  accent: "--bo-color-accent",
  background: "--bo-color-background",
  surface: "--bo-color-surface",
  textPrimary: "--bo-color-text-primary",
  textSecondary: "--bo-color-text-secondary",
} as const;

export type ThemeStyleVars = Record<string, string>;

export const themeStyleVars = (
  trade: TradeType | undefined,
): ThemeStyleVars => {
  const theme = getTheme(trade);
  return {
    [CUSTOMER_THEME_VAR.primary]: theme.colors.primary,
    [CUSTOMER_THEME_VAR.secondary]: theme.colors.secondary,
    [CUSTOMER_THEME_VAR.accent]: theme.colors.accent,
    [CUSTOMER_THEME_VAR.background]: theme.colors.background,
    [CUSTOMER_THEME_VAR.surface]: theme.colors.surface,
    [CUSTOMER_THEME_VAR.textPrimary]: theme.colors.textPrimary,
    [CUSTOMER_THEME_VAR.textSecondary]: theme.colors.textSecondary,
  };
};
