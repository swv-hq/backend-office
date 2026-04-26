import { describe, it, expect } from "vitest";
import {
  themes,
  defaultTheme,
  terminology,
  defaultTerminology,
  getTheme,
  getTerminology,
  type TradeType,
  type ThemeTokens,
} from "./themes";

const TRADES: TradeType[] = ["handyman", "plumber", "electrician"];

const REQUIRED_TERMINOLOGY_KEYS = [
  "jobLabel",
  "jobLabelPlural",
  "estimateLabel",
  "invoiceLabel",
  "materialCategory",
  "tradeNoun",
  "tradeNounPlural",
  "promptTone",
] as const;

const hexToRgb = (hex: string): [number, number, number] => {
  const m = hex.replace("#", "");
  const v =
    m.length === 3
      ? m
          .split("")
          .map((c) => c + c)
          .join("")
      : m;
  return [
    parseInt(v.slice(0, 2), 16),
    parseInt(v.slice(2, 4), 16),
    parseInt(v.slice(4, 6), 16),
  ];
};

const relativeLuminance = (hex: string): number => {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrastRatio = (a: string, b: string): number => {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [light, dark] = la > lb ? [la, lb] : [lb, la];
  return (light + 0.05) / (dark + 0.05);
};

describe("BO-SPEC-005: Trade Theming — themes source of truth", () => {
  describe("theme registry shape [BO-SPEC-005.AC9]", () => {
    it("exports a theme for each of the three trades", () => {
      for (const t of TRADES) {
        expect(themes[t]).toBeDefined();
      }
    });

    it("exports a neutral default theme distinct from any trade", () => {
      expect(defaultTheme).toBeDefined();
      for (const t of TRADES) {
        expect(defaultTheme.colors.primary).not.toBe(themes[t].colors.primary);
      }
    });

    it("each theme exposes required color tokens", () => {
      const required: (keyof ThemeTokens["colors"])[] = [
        "primary",
        "secondary",
        "accent",
        "background",
        "surface",
        "textPrimary",
        "textSecondary",
        "success",
        "warning",
        "error",
      ];
      for (const t of TRADES) {
        for (const key of required) {
          expect(themes[t].colors[key]).toMatch(/^#[0-9a-fA-F]{6}$/);
        }
      }
    });
  });

  describe("WCAG AA contrast [BO-SPEC-005.AC9]", () => {
    const allThemes = { ...themes, neutral: defaultTheme };
    it.each(Object.entries(allThemes))(
      "%s theme: textPrimary on background ≥ 4.5:1",
      (_name, theme) => {
        expect(
          contrastRatio(theme.colors.textPrimary, theme.colors.background),
        ).toBeGreaterThanOrEqual(4.5);
      },
    );

    it.each(Object.entries(allThemes))(
      "%s theme: textSecondary on background ≥ 4.5:1",
      (_name, theme) => {
        expect(
          contrastRatio(theme.colors.textSecondary, theme.colors.background),
        ).toBeGreaterThanOrEqual(4.5);
      },
    );

    it.each(Object.entries(allThemes))(
      "%s theme: primary on background ≥ 3:1 (large/UI element)",
      (_name, theme) => {
        expect(
          contrastRatio(theme.colors.primary, theme.colors.background),
        ).toBeGreaterThanOrEqual(3);
      },
    );
  });

  describe("CVD-safe distinctness [BO-SPEC-005.AC2]", () => {
    it("each pair of trades is distinguishable via primary, secondary, or accent (Δ luminance ≥ 0.02 in at least one)", () => {
      for (let i = 0; i < TRADES.length; i++) {
        for (let j = i + 1; j < TRADES.length; j++) {
          const a = themes[TRADES[i]];
          const b = themes[TRADES[j]];
          const deltas = (["primary", "secondary", "accent"] as const).map(
            (k) =>
              Math.abs(
                relativeLuminance(a.colors[k]) - relativeLuminance(b.colors[k]),
              ),
          );
          expect(Math.max(...deltas)).toBeGreaterThanOrEqual(0.02);
        }
      }
    });
  });

  describe("terminology map [BO-SPEC-005.AC3, BO-SPEC-005.AC7]", () => {
    it("provides terminology for each trade with all required keys", () => {
      for (const t of TRADES) {
        const map = terminology[t];
        expect(map).toBeDefined();
        for (const key of REQUIRED_TERMINOLOGY_KEYS) {
          expect(map[key]).toBeTruthy();
          expect(typeof map[key]).toBe("string");
        }
      }
    });

    it("provides a neutral default terminology with the same keys", () => {
      for (const key of REQUIRED_TERMINOLOGY_KEYS) {
        expect(defaultTerminology[key]).toBeTruthy();
      }
    });

    it("plumber and handyman use distinct jobLabel terminology", () => {
      expect(terminology.plumber.jobLabel).not.toBe(
        terminology.handyman.jobLabel,
      );
    });
  });

  describe("lookup helpers", () => {
    it("getTheme returns the trade theme for a known trade", () => {
      expect(getTheme("plumber")).toBe(themes.plumber);
    });

    it("getTheme returns the neutral default when trade is undefined", () => {
      expect(getTheme(undefined)).toBe(defaultTheme);
    });

    it("getTerminology returns the trade map for a known trade", () => {
      expect(getTerminology("electrician")).toBe(terminology.electrician);
    });

    it("getTerminology returns the default when trade is undefined", () => {
      expect(getTerminology(undefined)).toBe(defaultTerminology);
    });
  });
});
