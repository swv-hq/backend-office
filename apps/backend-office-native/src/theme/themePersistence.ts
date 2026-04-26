import * as SecureStore from "expo-secure-store";
import type { TradeType } from "@backend-office/backend/themes";

const KEY = "bo.trade";
const VALID: TradeType[] = ["handyman", "plumber", "electrician"];

type SecureStoreLike = {
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
  deleteItemAsync: (key: string) => Promise<void>;
};

let store: SecureStoreLike = SecureStore;

export const __setSecureStoreForTests = (s: SecureStoreLike): void => {
  store = s;
};

export const loadPersistedTrade = async (): Promise<TradeType | undefined> => {
  try {
    const v = await store.getItemAsync(KEY);
    return v && (VALID as string[]).includes(v) ? (v as TradeType) : undefined;
  } catch {
    return undefined;
  }
};

export const persistTrade = async (trade: TradeType): Promise<void> => {
  try {
    await store.setItemAsync(KEY, trade);
  } catch {
    // best-effort; persistence failures must not crash the app
  }
};

export const clearPersistedTrade = async (): Promise<void> => {
  try {
    await store.deleteItemAsync(KEY);
  } catch {
    // best-effort
  }
};
