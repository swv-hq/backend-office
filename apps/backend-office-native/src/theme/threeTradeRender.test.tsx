import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Text, View } from "react-native";
import { ThemeProvider, useTheme } from "./ThemeProvider";
import { themes } from "@backend-office/backend/themes";
import { __setSecureStoreForTests } from "./themePersistence";

const fakeStore = () => {
  const store: Record<string, string> = {};
  return {
    store,
    getItemAsync: jest.fn(async (k: string) => store[k] ?? null),
    setItemAsync: jest.fn(async (k: string, v: string) => {
      store[k] = v;
    }),
    deleteItemAsync: jest.fn(async (k: string) => {
      delete store[k];
    }),
  };
};

const flush = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

const ThemedSampleScreen = () => {
  const { theme } = useTheme();
  return (
    <View
      testID="screen-root"
      style={{ backgroundColor: theme.colors.background }}
    >
      <Text testID="title" style={{ color: theme.colors.textPrimary }}>
        Title
      </Text>
      <Text testID="subtitle" style={{ color: theme.colors.textSecondary }}>
        Subtitle
      </Text>
      <View testID="cta" style={{ backgroundColor: theme.colors.primary }} />
      <View testID="badge" style={{ backgroundColor: theme.colors.accent }} />
    </View>
  );
};

const TRADES = ["handyman", "plumber", "electrician"] as const;

const renderForTrade = async (trade: (typeof TRADES)[number]) => {
  __setSecureStoreForTests(fakeStore());
  let tree: TestRenderer.ReactTestRenderer;
  await act(async () => {
    tree = TestRenderer.create(
      <ThemeProvider trade={trade}>
        <ThemedSampleScreen />
      </ThemeProvider>,
    );
  });
  await flush();
  return tree!;
};

const styleOf = (tree: TestRenderer.ReactTestRenderer, testID: string) =>
  tree.root.findByProps({ testID }).props.style;

describe("BO-SPEC-005: three-trade visual distinctness", () => {
  describe.each(TRADES)(
    "%s theme renders correctly [BO-SPEC-005.AC2, BO-SPEC-005.AC10]",
    (trade) => {
      it("propagates primary, accent, background, textPrimary, textSecondary", async () => {
        const tree = await renderForTrade(trade);
        const expected = themes[trade].colors;
        expect(styleOf(tree, "screen-root").backgroundColor).toBe(
          expected.background,
        );
        expect(styleOf(tree, "title").color).toBe(expected.textPrimary);
        expect(styleOf(tree, "subtitle").color).toBe(expected.textSecondary);
        expect(styleOf(tree, "cta").backgroundColor).toBe(expected.primary);
        expect(styleOf(tree, "badge").backgroundColor).toBe(expected.accent);
      });
    },
  );

  it("each trade produces a distinct primary on the CTA [BO-SPEC-005.AC2]", async () => {
    const seen = new Set<string>();
    for (const trade of TRADES) {
      const tree = await renderForTrade(trade);
      seen.add(styleOf(tree, "cta").backgroundColor);
    }
    expect(seen.size).toBe(TRADES.length);
  });

  it("renders without crash for every trade [BO-SPEC-005.AC10]", async () => {
    for (const trade of TRADES) {
      const tree = await renderForTrade(trade);
      expect(tree.toJSON()).toBeTruthy();
    }
  });
});
