import { describe, it, expect } from "vitest";
import {
  getTerminology,
  terminology,
  defaultTerminology,
} from "@backend-office/backend/themes";

describe("BO-SPEC-005: shared terminology importable on web [BO-SPEC-005.AC3]", () => {
  it("getTerminology returns plumber map for plumber", () => {
    expect(getTerminology("plumber")).toBe(terminology.plumber);
  });

  it("getTerminology returns electrician map for electrician", () => {
    expect(getTerminology("electrician")).toBe(terminology.electrician);
  });

  it("getTerminology returns default when trade is undefined", () => {
    expect(getTerminology(undefined)).toBe(defaultTerminology);
  });

  it("plumber and handyman jobLabels differ on web (consistent with native)", () => {
    expect(terminology.plumber.jobLabel).not.toBe(
      terminology.handyman.jobLabel,
    );
  });
});
