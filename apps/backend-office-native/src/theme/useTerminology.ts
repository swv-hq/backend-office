import type { TerminologyMap } from "@backend-office/backend/themes";
import { useTheme } from "./ThemeProvider";

export const useTerminology = (): TerminologyMap => useTheme().terminology;
