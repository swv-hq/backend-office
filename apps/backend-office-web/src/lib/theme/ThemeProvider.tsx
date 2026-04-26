import React from "react";
import type { TradeType } from "@backend-office/backend/themes";
import { themeStyleVars } from "./themeStyle";

export const ThemeProvider: React.FC<{
  trade: TradeType | undefined;
  children: React.ReactNode;
}> = ({ trade, children }) => {
  const style = themeStyleVars(trade) as React.CSSProperties;
  return (
    <div data-bo-theme={trade ?? "neutral"} style={style}>
      {children}
    </div>
  );
};
