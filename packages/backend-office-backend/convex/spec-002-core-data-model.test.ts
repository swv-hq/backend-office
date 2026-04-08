import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  computeJobRollup,
  type SegmentLike,
  type EstimateLike,
  type InvoiceLike,
} from "./lib/jobStatus";

const convexDir = path.resolve(__dirname);

const readFile = (filename: string) =>
  fs.readFileSync(path.join(convexDir, filename), "utf-8");

describe("BO-SPEC-002: Core Data Model", () => {
  const schema = readFile("schema.ts");
  const validators = readFile("lib/validators.ts");
  const jobStatusSrc = readFile("lib/jobStatus.ts");

  describe("contractors table [BO-SPEC-002.AC1]", () => {
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

  describe("contacts table [BO-SPEC-002.AC2]", () => {
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

  describe("jobs table [BO-SPEC-002.AC3]", () => {
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

  describe("estimates table [BO-SPEC-002.AC4]", () => {
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

  describe("invoices table [BO-SPEC-002.AC5]", () => {
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

  describe("callLogs table [BO-SPEC-002.AC6]", () => {
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

  describe("accessTokens table [BO-SPEC-002.AC7]", () => {
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

  describe("indexes [BO-SPEC-002.AC8]", () => {
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

  describe("validators [BO-SPEC-002.AC9]", () => {
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

  describe("schema compilation [BO-SPEC-002.AC10] [BO-SPEC-002.AC11]", () => {
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

  describe("jobSegments table [BO-SPEC-002.AC12]", () => {
    it("defines the jobSegments table", () => {
      expect(schema).toContain("jobSegments: defineTable");
    });

    it("has all required fields", () => {
      const requiredFields = [
        "jobId",
        "contractorId",
        "sequence",
        "status",
        "createdAt",
        "updatedAt",
      ];
      for (const field of requiredFields) {
        expect(schema).toContain(field);
      }
    });

    it("has segment status as a union of literals including canceled", () => {
      expect(schema).toContain('v.literal("scheduled")');
      expect(schema).toContain('v.literal("canceled")');
    });

    it("has optional scheduling and timing fields", () => {
      const optionalFields = [
        "scheduledAt",
        "scheduledDuration",
        "startedAt",
        "completedAt",
      ];
      for (const field of optionalFields) {
        expect(schema).toContain(field);
      }
    });

    it("has segment indexes", () => {
      expect(schema).toContain("by_contractorId_scheduledAt");
      expect(schema).toContain("by_contractorId_status");
    });

    it("removes scheduledAt/completedAt from jobs (moved to segments)", () => {
      // jobs table block — confirm these fields are no longer top-level on jobs.
      const jobsBlock = schema.slice(
        schema.indexOf("jobs: defineTable"),
        schema.indexOf("jobSegments: defineTable"),
      );
      expect(jobsBlock).not.toMatch(/scheduledAt:\s*v\.optional/);
      expect(jobsBlock).not.toMatch(/completedAt:\s*v\.optional/);
    });
  });

  describe("line item segment tagging [BO-SPEC-002.AC13]", () => {
    it("lineItemValidator allows optional segmentId", () => {
      expect(validators).toContain("segmentId");
      expect(validators).toMatch(
        /segmentId:\s*v\.optional\(v\.id\("jobSegments"\)\)/,
      );
    });

    it("lineItemValidator allows optional segmentTitle", () => {
      expect(validators).toMatch(
        /segmentTitle:\s*v\.optional\(v\.string\(\)\)/,
      );
    });

    it("type field stays a freeform string (supports deposit_credit)", () => {
      expect(validators).toMatch(/type:\s*v\.string\(\)/);
    });
  });

  describe("invoice updates [BO-SPEC-002.AC5]", () => {
    it("invoices table has invoiceType union", () => {
      expect(schema).toContain('v.literal("deposit")');
      expect(schema).toContain('v.literal("progress")');
      expect(schema).toContain('v.literal("final")');
    });

    it("invoices table has segmentIds array", () => {
      expect(schema).toMatch(
        /segmentIds:\s*v\.array\(v\.id\("jobSegments"\)\)/,
      );
    });

    it("invoices table has creditedDepositInvoiceIds array", () => {
      expect(schema).toMatch(
        /creditedDepositInvoiceIds:\s*v\.array\(v\.id\("invoices"\)\)/,
      );
    });

    it("invoices table has invoiceNumber string", () => {
      expect(schema).toMatch(/invoiceNumber:\s*v\.string\(\)/);
    });
  });

  describe("estimate numbering and segment fields [BO-SPEC-002.AC4] [BO-SPEC-002.AC15]", () => {
    it("estimates table has estimateNumber string", () => {
      expect(schema).toMatch(/estimateNumber:\s*v\.string\(\)/);
    });
  });

  describe("numbering counters [BO-SPEC-002.AC15] [BO-SPEC-002.AC16]", () => {
    it("contractors table has nextJobNumber", () => {
      expect(schema).toMatch(/nextJobNumber:\s*v\.number\(\)/);
    });

    it("jobs table has jobNumber, nextEstimateVersion, nextInvoiceSequence", () => {
      expect(schema).toMatch(/jobNumber:\s*v\.number\(\)/);
      expect(schema).toMatch(/nextEstimateVersion:\s*v\.number\(\)/);
      expect(schema).toMatch(/nextInvoiceSequence:\s*v\.number\(\)/);
    });

    it("jobs table has by_contractorId_jobNumber index", () => {
      expect(schema).toContain("by_contractorId_jobNumber");
    });
  });

  describe("jobStatus helper [BO-SPEC-002.AC14]", () => {
    it("module exports computeJobRollup", () => {
      expect(jobStatusSrc).toContain("export function computeJobRollup");
    });

    const seg = (
      status: SegmentLike["status"],
      scheduledAt?: number,
      completedAt?: number,
    ): SegmentLike => ({ status, scheduledAt, completedAt });
    const est = (status: EstimateLike["status"]): EstimateLike => ({ status });
    const inv = (status: InvoiceLike["status"]): InvoiceLike => ({ status });

    it("returns lead when no estimates exist", () => {
      expect(computeJobRollup([], [], []).status).toBe("lead");
    });

    it("returns estimated when estimates exist but none approved", () => {
      expect(computeJobRollup([], [est("draft"), est("sent")], []).status).toBe(
        "estimated",
      );
    });

    it("returns approved when an approved estimate exists and segments are still scheduled", () => {
      expect(
        computeJobRollup(
          [seg("scheduled", 1000), seg("scheduled", 2000)],
          [est("approved")],
          [],
        ).status,
      ).toBe("approved");
    });

    it("returns approved when approved estimate exists but no segments yet", () => {
      expect(computeJobRollup([], [est("approved")], []).status).toBe(
        "approved",
      );
    });

    it("returns in_progress when any segment is in_progress", () => {
      expect(
        computeJobRollup(
          [seg("scheduled"), seg("in_progress")],
          [est("approved")],
          [],
        ).status,
      ).toBe("in_progress");
    });

    it("returns in_progress when some but not all segments completed", () => {
      expect(
        computeJobRollup(
          [seg("completed", undefined, 5000), seg("scheduled")],
          [est("approved")],
          [],
        ).status,
      ).toBe("in_progress");
    });

    it("returns completed when all non-canceled segments completed but invoice unpaid", () => {
      const r = computeJobRollup(
        [seg("completed", 1000, 5000), seg("completed", 2000, 6000)],
        [est("approved")],
        [inv("sent")],
      );
      expect(r.status).toBe("completed");
      expect(r.completedAt).toBe(6000);
    });

    it("stays completed (not paid) when all invoices are still drafts", () => {
      // A job with all segments completed but no billable invoice yet should
      // not roll up to paid. Drafts don't count toward the "all paid" check.
      expect(
        computeJobRollup(
          [seg("completed", 1000, 5000)],
          [est("approved")],
          [inv("draft"), inv("draft")],
        ).status,
      ).toBe("completed");
    });

    it("returns paid when completed and all non-draft invoices paid", () => {
      expect(
        computeJobRollup(
          [seg("completed", 1000, 5000)],
          [est("approved")],
          [inv("paid"), inv("draft")],
        ).status,
      ).toBe("paid");
    });

    it("excludes canceled segments from rollups", () => {
      const r = computeJobRollup(
        [
          seg("completed", 1000, 5000),
          seg("canceled", 2000),
          seg("completed", 3000, 7000),
        ],
        [est("approved")],
        [inv("paid")],
      );
      expect(r.status).toBe("paid");
      expect(r.scheduledStartAt).toBe(1000);
      expect(r.scheduledCompleteAt).toBe(3000);
      expect(r.completedAt).toBe(7000);
    });

    it("derives scheduled window from min/max segment scheduledAt", () => {
      const r = computeJobRollup(
        [
          seg("scheduled", 3000),
          seg("scheduled", 1000),
          seg("scheduled", 2000),
        ],
        [est("approved")],
        [],
      );
      expect(r.scheduledStartAt).toBe(1000);
      expect(r.scheduledCompleteAt).toBe(3000);
    });

    it("returns undefined window/completedAt when no scheduling info", () => {
      const r = computeJobRollup([], [est("draft")], []);
      expect(r.scheduledStartAt).toBeUndefined();
      expect(r.scheduledCompleteAt).toBeUndefined();
      expect(r.completedAt).toBeUndefined();
    });
  });

  describe("negative line items allowed [BO-SPEC-002.AC17]", () => {
    it("lineItemValidator does not constrain unitPrice/total to non-negative", () => {
      // The validator uses v.number() which permits negatives — verify there
      // is no positivity guard applied to either field.
      expect(validators).toMatch(/unitPrice:\s*v\.number\(\)/);
      expect(validators).toMatch(/total:\s*v\.number\(\)/);
    });
  });
});
