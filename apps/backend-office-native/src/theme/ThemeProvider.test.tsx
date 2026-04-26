import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Text } from "react-native";
import { ThemeProvider, useTheme } from "./ThemeProvider";
import { defaultTheme, themes } from "@backend-office/backend/themes";
import { __setSecureStoreForTests } from "./themePersistence";

const fakeStore = (initial: Record<string, string> = {}) => {
  const store = { ...initial };
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

const Probe = () => {
  const { theme, tradeType } = useTheme();
  return (
    <>
      <Text testID="primary">{theme.colors.primary}</Text>
      <Text testID="trade">{tradeType ?? "neutral"}</Text>
    </>
  );
};

describe("BO-SPEC-005: ThemeProvider", () => {
  beforeEach(() => {
    __setSecureStoreForTests(fakeStore());
  });

  it("provides neutral default theme when no trade is set [BO-SPEC-005.AC5]", async () => {
    let tree: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(
        <ThemeProvider trade={undefined}>
          <Probe />
        </ThemeProvider>,
      );
    });
    await flush();
    const primary = tree!.root.findByProps({ testID: "primary" }).props
      .children;
    const trade = tree!.root.findByProps({ testID: "trade" }).props.children;
    expect(primary).toBe(defaultTheme.colors.primary);
    expect(trade).toBe("neutral");
  });

  it("provides the trade theme when a trade is set [BO-SPEC-005.AC1]", async () => {
    let tree: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(
        <ThemeProvider trade="plumber">
          <Probe />
        </ThemeProvider>,
      );
    });
    await flush();
    const primary = tree!.root.findByProps({ testID: "primary" }).props
      .children;
    expect(primary).toBe(themes.plumber.colors.primary);
  });

  it("updates the theme without remount when trade changes [BO-SPEC-005.AC4]", async () => {
    let tree: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(
        <ThemeProvider trade="handyman">
          <Probe />
        </ThemeProvider>,
      );
    });
    await flush();
    expect(tree!.root.findByProps({ testID: "primary" }).props.children).toBe(
      themes.handyman.colors.primary,
    );

    await act(async () => {
      tree!.update(
        <ThemeProvider trade="electrician">
          <Probe />
        </ThemeProvider>,
      );
    });
    await flush();
    expect(tree!.root.findByProps({ testID: "primary" }).props.children).toBe(
      themes.electrician.colors.primary,
    );
  });

  it("uses persisted trade for first paint when trade prop is undefined [BO-SPEC-005.AC6]", async () => {
    __setSecureStoreForTests(fakeStore({ "bo.trade": "plumber" }));
    let tree: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(
        <ThemeProvider trade={undefined}>
          <Probe />
        </ThemeProvider>,
      );
    });
    await flush();
    expect(tree!.root.findByProps({ testID: "primary" }).props.children).toBe(
      themes.plumber.colors.primary,
    );
  });

  it("persists the trade when prop trade resolves [BO-SPEC-005.AC6]", async () => {
    const fake = fakeStore();
    __setSecureStoreForTests(fake);
    await act(async () => {
      TestRenderer.create(
        <ThemeProvider trade="electrician">
          <Probe />
        </ThemeProvider>,
      );
    });
    await flush();
    expect(fake.store["bo.trade"]).toBe("electrician");
  });
});
