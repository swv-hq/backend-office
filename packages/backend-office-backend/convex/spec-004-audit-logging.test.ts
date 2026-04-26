import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = (
  import.meta as unknown as {
    glob: (pattern: string) => Record<string, () => Promise<unknown>>;
  }
).glob("./**/*.{ts,tsx}");

describe("BO-SPEC-004: Audit Logging", () => {
  describe("Slice 1: logAudit helper [BO-SPEC-004.AC1, AC5, AC7, AC10]", () => {
    it("writes an entry with all expected fields [BO-SPEC-004.AC1]", async () => {
      const t = convexTest(schema, modules);
      const contractorId = await t.run((ctx) =>
        ctx.db.insert("contractors", {
          userId: "u1",
          firstName: "Pat",
          lastName: "Smith",
          businessName: "Smith Plumbing",
          phone: "555-0100",
          tradeType: "plumber",
          zipCode: "94110",
          onboardingCompleted: true,
          nextJobNumber: 1,
          createdAt: Date.now(),
        }),
      );

      await t.mutation(internal.data.auditLogs.logAudit, {
        contractorId,
        action: "create",
        entityType: "contact",
        entityId: "ct_123",
        details: { name: "Acme" },
      });

      const rows = await t.run((ctx) => ctx.db.query("auditLogs").collect());
      expect(rows).toHaveLength(1);
      const entry = rows[0]!;
      expect(entry.contractorId).toBe(contractorId);
      expect(entry.action).toBe("create");
      expect(entry.entityType).toBe("contact");
      expect(entry.entityId).toBe("ct_123");
      expect(entry.details).toEqual({ name: "Acme" });
      expect(typeof entry.timestamp).toBe("number");
    });

    it("accepts a null/system actor [BO-SPEC-004.AC5]", async () => {
      const t = convexTest(schema, modules);
      await t.mutation(internal.data.auditLogs.logAudit, {
        contractorId: null,
        action: "update",
        entityType: "job",
        entityId: "jb_999",
        details: { reason: "scheduled rollup" },
      });
      const rows = await t.run((ctx) => ctx.db.query("auditLogs").collect());
      expect(rows).toHaveLength(1);
      expect(rows[0]!.contractorId).toBeUndefined();
    });

    it("accepts every documented action [BO-SPEC-004.AC1, AC4]", async () => {
      const t = convexTest(schema, modules);
      const actions = [
        "create",
        "update",
        "delete",
        "access",
        "auth_success",
        "auth_failure",
      ] as const;
      for (const action of actions) {
        await t.mutation(internal.data.auditLogs.logAudit, {
          contractorId: null,
          action,
          entityType: "contractor",
          entityId: "x",
        });
      }
      const rows = await t.run((ctx) => ctx.db.query("auditLogs").collect());
      expect(rows.map((r) => r.action).sort()).toEqual([...actions].sort());
    });

    it("accepts an ipAddress for auth events [BO-SPEC-004.AC4]", async () => {
      const t = convexTest(schema, modules);
      await t.mutation(internal.data.auditLogs.logAudit, {
        contractorId: null,
        action: "auth_failure",
        entityType: "contractor",
        entityId: "unknown",
        ipAddress: "203.0.113.7",
      });
      const rows = await t.run((ctx) => ctx.db.query("auditLogs").collect());
      expect(rows[0]!.ipAddress).toBe("203.0.113.7");
    });

    it("rolls back the audit entry if the surrounding mutation throws [BO-SPEC-004.AC7]", async () => {
      const t = convexTest(schema, modules);
      const contractorId = await t.run((ctx) =>
        ctx.db.insert("contractors", {
          userId: "u2",
          firstName: "X",
          lastName: "Y",
          businessName: "Z",
          phone: "555-0200",
          tradeType: "handyman",
          zipCode: "00000",
          onboardingCompleted: true,
          nextJobNumber: 1,
          createdAt: Date.now(),
        }),
      );
      await expect(
        t.run(async (ctx) => {
          await ctx.runMutation(internal.data.auditLogs.logAudit, {
            contractorId,
            action: "create",
            entityType: "job",
            entityId: "jb_1",
          });
          throw new Error("simulated failure");
        }),
      ).rejects.toThrow("simulated failure");
      const rows = await t.run((ctx) => ctx.db.query("auditLogs").collect());
      expect(rows).toHaveLength(0);
    });

    it("rejects oversized details payloads [BO-SPEC-004.AC10]", async () => {
      const t = convexTest(schema, modules);
      const huge: Record<string, string> = {};
      for (let i = 0; i < 100; i++) huge[`k${i}`] = "x".repeat(200);
      await expect(
        t.mutation(internal.data.auditLogs.logAudit, {
          contractorId: null,
          action: "update",
          entityType: "contact",
          entityId: "c1",
          details: huge,
        }),
      ).rejects.toThrow();
    });
  });

  describe("Slice 2: retrieval queries [BO-SPEC-004.AC8, AC9]", () => {
    it("returns entries for a contractor within a time range [BO-SPEC-004.AC8]", async () => {
      const t = convexTest(schema, modules);
      const contractorId = await t.run((ctx) =>
        ctx.db.insert("contractors", {
          userId: "u3",
          firstName: "A",
          lastName: "B",
          businessName: "C",
          phone: "555-0300",
          tradeType: "electrician",
          zipCode: "00000",
          onboardingCompleted: true,
          nextJobNumber: 1,
          createdAt: 0,
        }),
      );
      const otherContractorId = await t.run((ctx) =>
        ctx.db.insert("contractors", {
          userId: "u4",
          firstName: "D",
          lastName: "E",
          businessName: "F",
          phone: "555-0400",
          tradeType: "electrician",
          zipCode: "00000",
          onboardingCompleted: true,
          nextJobNumber: 1,
          createdAt: 0,
        }),
      );
      await t.run(async (ctx) => {
        await ctx.db.insert("auditLogs", {
          contractorId,
          action: "create",
          entityType: "contact",
          entityId: "c1",
          timestamp: 100,
        });
        await ctx.db.insert("auditLogs", {
          contractorId,
          action: "update",
          entityType: "contact",
          entityId: "c1",
          timestamp: 200,
        });
        await ctx.db.insert("auditLogs", {
          contractorId,
          action: "delete",
          entityType: "contact",
          entityId: "c1",
          timestamp: 300,
        });
        await ctx.db.insert("auditLogs", {
          contractorId: otherContractorId,
          action: "create",
          entityType: "contact",
          entityId: "c2",
          timestamp: 200,
        });
      });

      const inRange = await t.query(internal.data.auditLogs.listByContractor, {
        contractorId,
        from: 100,
        to: 250,
      });
      expect(inRange.map((r) => r.timestamp).sort()).toEqual([100, 200]);
      expect(inRange.every((r) => r.contractorId === contractorId)).toBe(true);
    });

    it("returns entries for a specific entity [BO-SPEC-004.AC9]", async () => {
      const t = convexTest(schema, modules);
      await t.run(async (ctx) => {
        await ctx.db.insert("auditLogs", {
          action: "create",
          entityType: "job",
          entityId: "jb_1",
          timestamp: 1,
        });
        await ctx.db.insert("auditLogs", {
          action: "update",
          entityType: "job",
          entityId: "jb_1",
          timestamp: 2,
        });
        await ctx.db.insert("auditLogs", {
          action: "create",
          entityType: "job",
          entityId: "jb_2",
          timestamp: 3,
        });
        await ctx.db.insert("auditLogs", {
          action: "create",
          entityType: "contact",
          entityId: "jb_1",
          timestamp: 4,
        });
      });

      const history = await t.query(internal.data.auditLogs.listByEntity, {
        entityType: "job",
        entityId: "jb_1",
      });
      expect(history).toHaveLength(2);
      expect(history.every((r) => r.entityType === "job")).toBe(true);
      expect(history.every((r) => r.entityId === "jb_1")).toBe(true);
    });
  });

  describe("Slice 3: append-only surface [BO-SPEC-004.AC6]", () => {
    it("does not expose any public API to mutate or delete audit entries", () => {
      // Public api surface (not internal) should not include auditLogs.
      const publicKeys = Object.keys(api as unknown as Record<string, unknown>);
      expect(publicKeys).not.toContain("data");
      expect(publicKeys).not.toContain("auditLogs");
    });

    it("does not patch or delete from auditLogs anywhere in the data layer except the purge", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const dataDir = path.resolve(__dirname, "data");
      const files = fs
        .readdirSync(dataDir)
        .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"));
      const forbidden = /ctx\.db\.(patch|replace|delete)\s*\(/g;
      const offenders: string[] = [];
      for (const file of files) {
        const src = fs.readFileSync(path.join(dataDir, file), "utf-8");
        // Strip the purge function body — it is the lone permitted deleter.
        const stripped = src.replace(
          /export\s+const\s+purgeExpired[\s\S]*?\n\}\)?;/g,
          "",
        );
        if (forbidden.test(stripped)) offenders.push(file);
      }
      expect(offenders).toEqual([]);
    });
  });

  describe("Foundation contract for downstream specs [BO-SPEC-004.AC2, AC3]", () => {
    it("accepts jobSegment status transition events [BO-SPEC-004.AC2]", async () => {
      const t = convexTest(schema, modules);
      const transitions = [
        { from: null, to: "scheduled" },
        { from: "scheduled", to: "in_progress" },
        { from: "in_progress", to: "completed" },
        { from: "scheduled", to: "canceled" },
      ] as const;
      for (const transition of transitions) {
        await t.mutation(internal.data.auditLogs.logAudit, {
          contractorId: null,
          action: "update",
          entityType: "jobSegment",
          entityId: "seg_1",
          details: { transition },
        });
      }
      const rows = await t.run((ctx) =>
        ctx.db
          .query("auditLogs")
          .withIndex("by_entity", (q) =>
            q.eq("entityType", "jobSegment").eq("entityId", "seg_1"),
          )
          .collect(),
      );
      expect(rows).toHaveLength(transitions.length);
    });

    it("accepts derived job status change events with prev/new in details [BO-SPEC-004.AC3]", async () => {
      const t = convexTest(schema, modules);
      await t.mutation(internal.data.auditLogs.logAudit, {
        contractorId: null,
        action: "update",
        entityType: "job",
        entityId: "jb_1",
        details: { rolledUpStatus: { from: "estimated", to: "in_progress" } },
      });
      const [entry] = await t.run((ctx) => ctx.db.query("auditLogs").collect());
      expect(entry?.entityType).toBe("job");
      expect(entry?.details).toEqual({
        rolledUpStatus: { from: "estimated", to: "in_progress" },
      });
    });
  });

  describe("Backend typecheck [BO-SPEC-004.AC12]", () => {
    it("passes tsc --noEmit on convex/ [BO-SPEC-004.AC12]", async () => {
      const { execSync } = await import("node:child_process");
      const fs = await import("node:fs");
      const path = await import("node:path");
      const cwd = path.resolve(__dirname, "..");
      // BO-SPEC-003's boundary-guard test writes a transient fixture into
      // convex/useCases/ that intentionally imports the un-installed `stripe`
      // package. Run tsc against a tsconfig that excludes those fixtures so
      // the two tests can run in parallel without colliding.
      const tmpTsconfig = path.join(
        cwd,
        "convex",
        `tsconfig.spec-004-${process.pid}.json`,
      );
      fs.writeFileSync(
        tmpTsconfig,
        JSON.stringify({
          extends: "./tsconfig.json",
          exclude: ["./_generated", "./useCases/__boundary-guard-fixture*"],
        }),
      );
      try {
        execSync(`npx tsc --noEmit -p "${tmpTsconfig}"`, {
          cwd,
          stdio: "pipe",
        });
      } catch (err) {
        const e = err as { stdout?: Buffer; stderr?: Buffer };
        const out = `${e.stdout?.toString() ?? ""}${e.stderr?.toString() ?? ""}`;
        throw new Error(`Backend typecheck failed:\n${out}`);
      } finally {
        if (fs.existsSync(tmpTsconfig)) fs.rmSync(tmpTsconfig);
      }
    }, 60_000);
  });

  describe("Slice 4: retention purge [BO-SPEC-004.AC11]", () => {
    it("deletes entries older than 365 days and keeps everything within the window", async () => {
      const t = convexTest(schema, modules);
      const dayMs = 24 * 60 * 60 * 1000;
      const now = Date.now();
      const cutoff = now - 365 * dayMs;
      await t.run(async (ctx) => {
        await ctx.db.insert("auditLogs", {
          action: "create",
          entityType: "contact",
          entityId: "old",
          timestamp: cutoff - 1,
        });
        await ctx.db.insert("auditLogs", {
          action: "create",
          entityType: "contact",
          entityId: "boundary",
          timestamp: cutoff,
        });
        await ctx.db.insert("auditLogs", {
          action: "create",
          entityType: "contact",
          entityId: "fresh",
          timestamp: now - dayMs,
        });
      });

      await t.mutation(internal.data.auditLogs.purgeExpired, { now });

      const remaining = await t.run((ctx) =>
        ctx.db.query("auditLogs").collect(),
      );
      const ids = remaining.map((r) => r.entityId).sort();
      expect(ids).toEqual(["boundary", "fresh"]);
    });

    it("returns the number of deleted rows so the cron can observe progress", async () => {
      const t = convexTest(schema, modules);
      const dayMs = 24 * 60 * 60 * 1000;
      const now = Date.now();
      await t.run(async (ctx) => {
        for (let i = 0; i < 5; i++) {
          await ctx.db.insert("auditLogs", {
            action: "create",
            entityType: "contact",
            entityId: `e${i}`,
            timestamp: now - 400 * dayMs,
          });
        }
      });
      const result = await t.mutation(internal.data.auditLogs.purgeExpired, {
        now,
      });
      expect(result.deleted).toBe(5);
    });
  });
});
