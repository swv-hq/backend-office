import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Text } from "react-native";
import { ThemeProvider } from "./ThemeProvider";
import { useTerminology } from "./useTerminology";
import {
  terminology,
  defaultTerminology,
} from "@backend-office/backend/themes";
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

const Probe = () => {
  const t = useTerminology();
  return <Text testID="job">{t.jobLabel}</Text>;
};

beforeEach(() => {
  __setSecureStoreForTests(fakeStore());
});

describe("BO-SPEC-005: useTerminology [BO-SPEC-005.AC3]", () => {
  it("returns plumber terminology under plumber theme", async () => {
    let tree: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(
        <ThemeProvider trade="plumber">
          <Probe />
        </ThemeProvider>,
      );
    });
    await flush();
    expect(tree!.root.findByProps({ testID: "job" }).props.children).toBe(
      terminology.plumber.jobLabel,
    );
  });

  it("returns handyman terminology under handyman theme", async () => {
    let tree: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(
        <ThemeProvider trade="handyman">
          <Probe />
        </ThemeProvider>,
      );
    });
    await flush();
    expect(tree!.root.findByProps({ testID: "job" }).props.children).toBe(
      terminology.handyman.jobLabel,
    );
  });

  it("returns default terminology when no trade is set", async () => {
    let tree: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(
        <ThemeProvider trade={undefined}>
          <Probe />
        </ThemeProvider>,
      );
    });
    await flush();
    expect(tree!.root.findByProps({ testID: "job" }).props.children).toBe(
      defaultTerminology.jobLabel,
    );
  });
});
