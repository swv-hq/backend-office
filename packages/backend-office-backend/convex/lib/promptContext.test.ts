import { describe, it, expect } from "vitest";
import { buildPromptContext } from "./promptContext";
import { terminology, defaultTerminology } from "./themes";

describe("BO-SPEC-005: buildPromptContext [BO-SPEC-005.AC7]", () => {
  it("returns plumber terminology + tone for plumber", () => {
    const ctx = buildPromptContext("plumber");
    expect(ctx.terminology).toBe(terminology.plumber);
    expect(ctx.tone).toBe(terminology.plumber.promptTone);
    expect(ctx.tradeType).toBe("plumber");
  });

  it("returns electrician terminology + tone for electrician", () => {
    const ctx = buildPromptContext("electrician");
    expect(ctx.terminology).toBe(terminology.electrician);
    expect(ctx.tone).toBe(terminology.electrician.promptTone);
  });

  it("returns handyman terminology + tone for handyman", () => {
    const ctx = buildPromptContext("handyman");
    expect(ctx.terminology).toBe(terminology.handyman);
    expect(ctx.tone).toBe(terminology.handyman.promptTone);
  });

  it("falls back to default terminology when trade is undefined", () => {
    const ctx = buildPromptContext(undefined);
    expect(ctx.terminology).toBe(defaultTerminology);
    expect(ctx.tone).toBe(defaultTerminology.promptTone);
    expect(ctx.tradeType).toBeUndefined();
  });

  describe("renderSystemPrompt", () => {
    it("includes the trade tone and trade-specific job label in plumber prompts", () => {
      const ctx = buildPromptContext("plumber");
      const prompt = ctx.renderSystemPrompt();
      expect(prompt).toContain(terminology.plumber.promptTone);
      expect(prompt).toContain(terminology.plumber.jobLabel);
      expect(prompt).toContain(terminology.plumber.materialCategory);
    });

    it("uses different prompts for handyman vs plumber (terminology differs)", () => {
      const handymanPrompt =
        buildPromptContext("handyman").renderSystemPrompt();
      const plumberPrompt = buildPromptContext("plumber").renderSystemPrompt();
      expect(handymanPrompt).not.toBe(plumberPrompt);
      expect(plumberPrompt).toContain("Service Call");
      expect(handymanPrompt).not.toContain("Service Call");
    });

    it("renders a usable prompt for the default (no-trade) case", () => {
      const prompt = buildPromptContext(undefined).renderSystemPrompt();
      expect(prompt.length).toBeGreaterThan(0);
      expect(prompt).toContain(defaultTerminology.promptTone);
    });
  });
});
