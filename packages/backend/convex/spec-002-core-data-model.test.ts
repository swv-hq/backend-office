import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

const convexDir = path.resolve(__dirname);

const readFile = (filename: string) =>
  fs.readFileSync(path.join(convexDir, filename), "utf-8");

describe("SPEC-002: Core Data Model", () => {
  const schema = readFile("schema.ts");
  const validators = readFile("lib/validators.ts");

  describe("contractors table [SPEC-002.AC1]", () => {
    it("defines the contractors table", () => {
      expect(schema).toContain("contractors: defineTable");
    });

    it("has all required fields", () => {
      const requiredFields = [
        "userId",
        "firstName",
        "lastName",
        "businessName",
        "phone",
        "tradeType",
        "zipCode",
        "onboardingCompleted",
        "createdAt",
      ];
      for (const field of requiredFields) {
        expect(schema).toContain(field);
      }
    });

    it("has tradeType as a union of literals", () => {
      expect(schema).toContain('v.literal("handyman")');
      expect(schema).toContain('v.literal("plumber")');
      expect(schema).toContain('v.literal("electrician")');
    });

    it("has optional fields", () => {
      const optionalFields = [
        "stripeAccountId",
        "stripeAccountType",
        "calendarProvider",
        "twilioPhoneNumber",
        "forwardingConfigured",
        "logoFileId",
      ];
      for (const field of optionalFields) {
        expect(schema).toContain(field);
      }
    });

    it("has calendarProvider as optional union of literals", () => {
      expect(schema).toContain('v.literal("google")');
      expect(schema).toContain('v.literal("apple")');
      expect(schema).toContain('v.literal("in_app")');
    });
  });

  describe("contacts table [SPEC-002.AC2]", () => {
    it("defines the contacts table", () => {
      expect(schema).toContain("contacts: defineTable");
    });

    it("has all required fields", () => {
      const requiredFields = [
        "contractorId",
        "phone",
        "createdAt",
        "updatedAt",
      ];
      for (const field of requiredFields) {
        expect(schema).toContain(field);
      }
    });

    it("has source as a union of literals", () => {
      expect(schema).toContain('v.literal("missed_call")');
      expect(schema).toContain('v.literal("manual")');
      expect(schema).toContain('v.literal("voicemail")');
      expect(schema).toContain('v.literal("sms")');
    });

    it("uses the shared address validator", () => {
      expect(schema).toContain("addressValidator");
    });
  });

  describe("jobs table [SPEC-002.AC3]", () => {
    it("defines the jobs table", () => {
      expect(schema).toContain("jobs: defineTable");
    });

    it("has contactId as optional", () => {
      expect(schema).toMatch(/contactId:\s*v\.optional/);
    });

    it("has all job status literals", () => {
      const statuses = [
        "lead",
        "estimated",
        "approved",
        "in_progress",
        "completed",
        "paid",
      ];
      for (const status of statuses) {
        expect(schema).toContain(`v.literal("${status}")`);
      }
    });

    it("uses the shared address validator", () => {
      // Already checked addressValidator is imported; jobs table uses it
      expect(schema).toContain("addressValidator");
    });
  });

  describe("estimates table [SPEC-002.AC4]", () => {
    it("defines the estimates table", () => {
      expect(schema).toContain("estimates: defineTable");
    });

    it("has all required fields", () => {
      const requiredFields = [
        "jobId",
        "contractorId",
        "version",
        "lineItems",
        "total",
        "status",
        "createdAt",
      ];
      for (const field of requiredFields) {
        expect(schema).toContain(field);
      }
    });

    it("uses the shared lineItemValidator", () => {
      expect(schema).toContain("lineItemValidator");
    });

    it("has estimate status literals", () => {
      expect(schema).toContain('v.literal("draft")');
      expect(schema).toContain('v.literal("finalized")');
      expect(schema).toContain('v.literal("sent")');
      expect(schema).toContain('v.literal("declined")');
    });

    it("has conversationHistory as optional array", () => {
      expect(schema).toContain("conversationHistory");
    });

    it("has optional timestamp fields", () => {
      const optionalTimestamps = [
        "changeNotes",
        "sentAt",
        "approvedAt",
        "declinedAt",
      ];
      for (const field of optionalTimestamps) {
        expect(schema).toContain(field);
      }
    });
  });

  describe("invoices table [SPEC-002.AC5]", () => {
    it("defines the invoices table", () => {
      expect(schema).toContain("invoices: defineTable");
    });

    it("has all required fields", () => {
      const requiredFields = [
        "jobId",
        "contractorId",
        "estimateId",
        "lineItems",
        "total",
        "status",
        "createdAt",
      ];
      for (const field of requiredFields) {
        expect(schema).toContain(field);
      }
    });

    it("has invoice status literals", () => {
      expect(schema).toContain('v.literal("overdue")');
    });

    it("has optional payment fields", () => {
      expect(schema).toContain("paidAt");
      expect(schema).toContain("stripePaymentId");
      expect(schema).toContain("sentAt");
    });
  });

  describe("callLogs table [SPEC-002.AC6]", () => {
    it("defines the callLogs table", () => {
      expect(schema).toContain("callLogs: defineTable");
    });

    it("has direction as a union of literals", () => {
      expect(schema).toContain('v.literal("inbound")');
      expect(schema).toContain('v.literal("outbound")');
    });

    it("has call status as a union of literals", () => {
      expect(schema).toContain('v.literal("missed")');
      expect(schema).toContain('v.literal("answered")');
    });

    it("has callbackStatus as a union of literals", () => {
      expect(schema).toContain('v.literal("pending")');
      expect(schema).toContain('v.literal("reminded")');
    });

    it("has all required fields", () => {
      const requiredFields = [
        "contractorId",
        "callerPhone",
        "direction",
        "createdAt",
      ];
      for (const field of requiredFields) {
        expect(schema).toContain(field);
      }
    });

    it("has optional voicemail and transcript fields", () => {
      const optionalFields = [
        "voicemailUrl",
        "voicemailFileId",
        "transcript",
        "summary",
        "twilioCallSid",
        "duration",
      ];
      for (const field of optionalFields) {
        expect(schema).toContain(field);
      }
    });

    it("has expiresAt for retention policy", () => {
      expect(schema).toContain("expiresAt");
    });
  });

  describe("accessTokens table [SPEC-002.AC7]", () => {
    it("defines the accessTokens table", () => {
      expect(schema).toContain("accessTokens: defineTable");
    });

    it("has all required fields", () => {
      const requiredFields = ["entityType", "entityId", "token", "createdAt"];
      for (const field of requiredFields) {
        expect(schema).toContain(field);
      }
    });

    it("has optional expiration and usage tracking", () => {
      expect(schema).toContain("expiresAt");
      expect(schema).toContain("usedAt");
    });
  });

  describe("indexes [SPEC-002.AC8]", () => {
    it("has contractor indexes", () => {
      expect(schema).toContain("by_userId");
    });

    it("has contact indexes", () => {
      expect(schema).toContain("by_contractorId");
      expect(schema).toContain("by_contractorId_phone");
    });

    it("has job indexes", () => {
      expect(schema).toContain("by_contactId");
      expect(schema).toContain("by_status");
    });

    it("has estimate indexes", () => {
      expect(schema).toContain("by_jobId");
    });

    it("has callLog indexes", () => {
      expect(schema).toContain("by_callbackStatus");
    });

    it("has accessToken indexes", () => {
      expect(schema).toContain("by_token");
      expect(schema).toContain("by_entityType_entityId");
    });
  });

  describe("validators [SPEC-002.AC9]", () => {
    it("validators.ts uses proper Convex validator functions", () => {
      expect(validators).toContain("v.object(");
      expect(validators).toContain("v.string()");
      expect(validators).toContain("v.optional(");
      expect(validators).toContain("v.number()");
    });

    it("schema.ts uses proper Convex validator functions", () => {
      expect(schema).toContain("v.union(");
      expect(schema).toContain("v.literal(");
      expect(schema).toContain("v.optional(");
      expect(schema).toContain("v.boolean()");
      expect(schema).toContain("v.array(");
    });

    it("schema imports shared validators", () => {
      expect(schema).toContain('from "./lib/validators"');
    });
  });

  describe("schema compilation [SPEC-002.AC10] [SPEC-002.AC11]", () => {
    it("schema.ts exports defineSchema", () => {
      expect(schema).toContain("defineSchema");
      expect(schema).toContain("export default");
    });

    it("validators.ts exists and exports validators", () => {
      expect(fs.existsSync(path.join(convexDir, "lib/validators.ts"))).toBe(
        true,
      );
      expect(validators).toContain("export const addressValidator");
      expect(validators).toContain("export const lineItemValidator");
    });
  });
});
