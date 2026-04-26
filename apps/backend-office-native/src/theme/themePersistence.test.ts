import {
  loadPersistedTrade,
  persistTrade,
  clearPersistedTrade,
  __setSecureStoreForTests,
} from "./themePersistence";

type Store = Record<string, string>;

const makeFakeStore = () => {
  const store: Store = {};
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

describe("BO-SPEC-005: themePersistence [BO-SPEC-005.AC6]", () => {
  let fake: ReturnType<typeof makeFakeStore>;

  beforeEach(() => {
    fake = makeFakeStore();
    __setSecureStoreForTests(fake);
  });

  it("returns undefined when nothing is persisted", async () => {
    expect(await loadPersistedTrade()).toBeUndefined();
  });

  it("persists and loads a known trade", async () => {
    await persistTrade("plumber");
    expect(await loadPersistedTrade()).toBe("plumber");
  });

  it("ignores corrupted persisted values (returns undefined)", async () => {
    fake.store["bo.trade"] = "not-a-trade";
    expect(await loadPersistedTrade()).toBeUndefined();
  });

  it("clearPersistedTrade removes the value", async () => {
    await persistTrade("electrician");
    await clearPersistedTrade();
    expect(await loadPersistedTrade()).toBeUndefined();
  });
});
