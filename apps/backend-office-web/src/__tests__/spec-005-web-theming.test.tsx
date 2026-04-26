import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import {
  themes,
  defaultTheme,
  type TradeType,
} from "@backend-office/backend/themes";
import { themeStyleVars, CUSTOMER_THEME_VAR } from "../lib/theme/themeStyle";
import { ThemeProvider } from "../lib/theme/ThemeProvider";

const TRADES: TradeType[] = ["handyman", "plumber", "electrician"];

const hexToRgb = (hex: string): [number, number, number] => {
  const v = hex.replace("#", "");
  return [
    parseInt(v.slice(0, 2), 16),
    parseInt(v.slice(2, 4), 16),
    parseInt(v.slice(4, 6), 16),
  ];
};
const relLum = (hex: string) => {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const la = relLum(a);
  const lb = relLum(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
};

describe("BO-SPEC-005: web themeStyleVars [BO-SPEC-005.AC8]", () => {
  it.each(TRADES)("emits CSS variables for %s theme", (trade) => {
    const vars = themeStyleVars(trade);
    expect(vars[CUSTOMER_THEME_VAR.primary]).toBe(themes[trade].colors.primary);
    expect(vars[CUSTOMER_THEME_VAR.accent]).toBe(themes[trade].colors.accent);
    expect(vars[CUSTOMER_THEME_VAR.background]).toBe(
      themes[trade].colors.background,
    );
    expect(vars[CUSTOMER_THEME_VAR.textPrimary]).toBe(
      themes[trade].colors.textPrimary,
    );
  });

  it("falls back to neutral default when trade is undefined [BO-SPEC-005.AC5]", () => {
    const vars = themeStyleVars(undefined);
    expect(vars[CUSTOMER_THEME_VAR.primary]).toBe(defaultTheme.colors.primary);
  });
});

describe("BO-SPEC-005: web ThemeProvider renders themed wrapper [BO-SPEC-005.AC8, AC10]", () => {
  it.each(TRADES)("includes the %s primary in the rendered style", (trade) => {
    const html = renderToStaticMarkup(
      <ThemeProvider trade={trade}>
        <p>hello</p>
      </ThemeProvider>,
    );
    expect(html).toContain(themes[trade].colors.primary);
    expect(html).toContain("hello");
  });

  it("renders with neutral defaults when no trade supplied", () => {
    const html = renderToStaticMarkup(
      <ThemeProvider trade={undefined}>
        <p>x</p>
      </ThemeProvider>,
    );
    expect(html).toContain(defaultTheme.colors.primary);
  });
});

describe("BO-SPEC-005: web WCAG AA on customer-facing tokens [BO-SPEC-005.AC9]", () => {
  const allThemes = { ...themes, neutral: defaultTheme };
  it.each(Object.entries(allThemes))(
    "%s: textPrimary on background ≥ 4.5:1",
    (_name, theme) => {
      expect(
        contrast(theme.colors.textPrimary, theme.colors.background),
      ).toBeGreaterThanOrEqual(4.5);
    },
  );
  it.each(Object.entries(allThemes))(
    "%s: textSecondary on background ≥ 4.5:1",
    (_name, theme) => {
      expect(
        contrast(theme.colors.textSecondary, theme.colors.background),
      ).toBeGreaterThanOrEqual(4.5);
    },
  );
});
