import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  defaultTheme,
  defaultTerminology,
  getTheme,
  getTerminology,
  type ThemeTokens,
  type TerminologyMap,
  type TradeType,
} from "@backend-office/backend/themes";
import { loadPersistedTrade, persistTrade } from "./themePersistence";

type ThemeContextValue = {
  theme: ThemeTokens;
  terminology: TerminologyMap;
  tradeType: TradeType | undefined;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: defaultTheme,
  terminology: defaultTerminology,
  tradeType: undefined,
});

export const ThemeProvider: React.FC<{
  trade: TradeType | undefined;
  children: React.ReactNode;
}> = ({ trade, children }) => {
  const [persistedTrade, setPersistedTrade] = useState<TradeType | undefined>(
    undefined,
  );

  useEffect(() => {
    let cancelled = false;
    loadPersistedTrade().then((t) => {
      if (!cancelled) setPersistedTrade(t);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (trade) {
      persistTrade(trade);
    }
  }, [trade]);

  const effectiveTrade = trade ?? persistedTrade;

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: getTheme(effectiveTrade),
      terminology: getTerminology(effectiveTrade),
      tradeType: effectiveTrade,
    }),
    [effectiveTrade],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => useContext(ThemeContext);
