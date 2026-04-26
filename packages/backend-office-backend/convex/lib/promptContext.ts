import {
  defaultTerminology,
  getTerminology,
  type TerminologyMap,
  type TradeType,
} from "./themes";

export type PromptContext = {
  tradeType: TradeType | undefined;
  terminology: TerminologyMap;
  tone: string;
  renderSystemPrompt: () => string;
};

const renderSystemPrompt = (
  tradeType: TradeType | undefined,
  t: TerminologyMap,
): string => {
  const tradeNoun = tradeType ?? "contractor";
  return [
    `You are assisting a ${tradeNoun}.`,
    `Tone: ${t.promptTone}.`,
    `Use this terminology consistently:`,
    `- Refer to a unit of work as "${t.jobLabel}" (plural: "${t.jobLabelPlural}").`,
    `- Refer to estimates as "${t.estimateLabel}" and invoices as "${t.invoiceLabel}".`,
    `- Refer to materials as "${t.materialCategory}".`,
  ].join("\n");
};

export const buildPromptContext = (
  tradeType: TradeType | undefined,
): PromptContext => {
  const terminology = tradeType
    ? getTerminology(tradeType)
    : defaultTerminology;
  return {
    tradeType,
    terminology,
    tone: terminology.promptTone,
    renderSystemPrompt: () => renderSystemPrompt(tradeType, terminology),
  };
};
