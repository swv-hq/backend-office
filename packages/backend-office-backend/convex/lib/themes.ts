export type TradeType = "handyman" | "plumber" | "electrician";

export type ThemeTokens = {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    textPrimary: string;
    textSecondary: string;
    success: string;
    warning: string;
    error: string;
  };
};

export type TerminologyMap = {
  jobLabel: string;
  jobLabelPlural: string;
  estimateLabel: string;
  invoiceLabel: string;
  materialCategory: string;
  tradeNoun: string;
  tradeNounPlural: string;
  promptTone: string;
};

const sharedStatus = {
  success: "#1F8A4C",
  warning: "#B8860B",
  error: "#B00020",
};

const sharedSurface = {
  background: "#FFFFFF",
  surface: "#F5F5F5",
};

export const themes: Record<TradeType, ThemeTokens> = {
  handyman: {
    colors: {
      primary: "#2B2B2B",
      secondary: "#5A5A5A",
      accent: "#E8A33D",
      ...sharedSurface,
      textPrimary: "#1A1A1A",
      textSecondary: "#444444",
      ...sharedStatus,
    },
  },
  plumber: {
    colors: {
      primary: "#0B3D5C",
      secondary: "#1F6F8B",
      accent: "#E8A33D",
      ...sharedSurface,
      textPrimary: "#0B3D5C",
      textSecondary: "#444444",
      ...sharedStatus,
    },
  },
  electrician: {
    colors: {
      primary: "#111111",
      secondary: "#3A3A3A",
      accent: "#F5C518",
      ...sharedSurface,
      textPrimary: "#111111",
      textSecondary: "#444444",
      ...sharedStatus,
    },
  },
};

export const defaultTheme: ThemeTokens = {
  colors: {
    primary: "#4A4A4A",
    secondary: "#7A7A7A",
    accent: "#3B82F6",
    ...sharedSurface,
    textPrimary: "#1A1A1A",
    textSecondary: "#444444",
    ...sharedStatus,
  },
};

export const terminology: Record<TradeType, TerminologyMap> = {
  handyman: {
    jobLabel: "Job",
    jobLabelPlural: "Jobs",
    estimateLabel: "Estimate",
    invoiceLabel: "Invoice",
    materialCategory: "Materials",
    tradeNoun: "handyman",
    tradeNounPlural: "handymen",
    promptTone:
      "friendly, practical, and straightforward — like a neighborhood handyman explaining the work",
  },
  plumber: {
    jobLabel: "Service Call",
    jobLabelPlural: "Service Calls",
    estimateLabel: "Estimate",
    invoiceLabel: "Invoice",
    materialCategory: "Plumbing Supplies",
    tradeNoun: "plumber",
    tradeNounPlural: "plumbers",
    promptTone:
      "professional and trustworthy — use plumbing terminology (fixtures, fittings, supply lines) precisely",
  },
  electrician: {
    jobLabel: "Service Call",
    jobLabelPlural: "Service Calls",
    estimateLabel: "Estimate",
    invoiceLabel: "Invoice",
    materialCategory: "Electrical Supplies",
    tradeNoun: "electrician",
    tradeNounPlural: "electricians",
    promptTone:
      "precise and safety-conscious — use electrical terminology (circuits, panels, breakers) accurately and reference code where relevant",
  },
};

export const defaultTerminology: TerminologyMap = {
  jobLabel: "Job",
  jobLabelPlural: "Jobs",
  estimateLabel: "Estimate",
  invoiceLabel: "Invoice",
  materialCategory: "Materials",
  tradeNoun: "contractor",
  tradeNounPlural: "contractors",
  promptTone: "professional, clear, and helpful",
};

export const getTheme = (trade: TradeType | undefined): ThemeTokens =>
  trade ? themes[trade] : defaultTheme;

export const getTerminology = (trade: TradeType | undefined): TerminologyMap =>
  trade ? terminology[trade] : defaultTerminology;
