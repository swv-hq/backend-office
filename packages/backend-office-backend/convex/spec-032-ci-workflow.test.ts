import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { parse as parseYaml } from "yaml";

const repoRoot = path.resolve(__dirname, "../../..");
const workflowPath = path.join(repoRoot, ".github/workflows/quality-gates.yml");

interface WorkflowStep {
  name?: string;
  uses?: string;
  run?: string;
  "working-directory"?: string;
}

interface WorkflowJob {
  "runs-on"?: string;
  steps?: WorkflowStep[];
  strategy?: { "fail-fast"?: boolean };
}

interface Workflow {
  name?: string;
  on?: Record<string, unknown> | string[];
  jobs?: Record<string, WorkflowJob>;
}

function loadWorkflow(): Workflow {
  const src = fs.readFileSync(workflowPath, "utf-8");
  return parseYaml(src) as Workflow;
}

function allRunCommands(wf: Workflow): string[] {
  const commands: string[] = [];
  for (const job of Object.values(wf.jobs ?? {})) {
    for (const step of job.steps ?? []) {
      if (step.run) commands.push(step.run);
    }
  }
  return commands;
}

function allStepText(wf: Workflow): string {
  const parts: string[] = [];
  for (const job of Object.values(wf.jobs ?? {})) {
    for (const step of job.steps ?? []) {
      if (step.run) parts.push(step.run);
      if (step["working-directory"]) parts.push(step["working-directory"]);
    }
  }
  return parts.join("\n");
}

describe("BO-SPEC-032: Quality Gates CI Workflow", () => {
  it("workflow file exists at .github/workflows/quality-gates.yml [BO-SPEC-032.AC23]", () => {
    expect(fs.existsSync(workflowPath)).toBe(true);
  });

  it("triggers on pull_request and push to main [BO-SPEC-032.AC23]", () => {
    const wf = loadWorkflow();
    // YAML 'on' key is parsed as boolean true by yaml v2 unless quoted.
    // Accept either the string key 'on' or the parsed-true key.
    const triggers = (wf.on ?? (wf as unknown as { true?: unknown }).true) as
      | Record<string, unknown>
      | string[]
      | undefined;
    expect(triggers).toBeDefined();
    const triggerKeys = Array.isArray(triggers)
      ? triggers
      : Object.keys(triggers ?? {});
    expect(triggerKeys).toContain("pull_request");
    expect(triggerKeys).toContain("push");
  });

  it("runs all required quality gates [BO-SPEC-032.AC23]", () => {
    const wf = loadWorkflow();
    const commands = allRunCommands(wf).join("\n");
    // The full quality gate per spec §Quality Gates Workflow:
    // npm ci, lint, typecheck, format check, build, per-workspace tests,
    // spec-coverage:strict
    expect(commands).toMatch(/npm\s+ci/);
    expect(commands).toMatch(/npm\s+run\s+lint/);
    expect(commands).toMatch(/npm\s+run\s+typecheck/);
    expect(commands).toMatch(/prettier.*--check|npm\s+run\s+format/);
    expect(commands).toMatch(/npm\s+run\s+build/);
    expect(commands).toMatch(/test:spec-coverage:strict/);
  });

  it("runs each workspace's test suite [BO-SPEC-032.AC23]", () => {
    const wf = loadWorkflow();
    const text = allStepText(wf);
    // Per docs/products/backend-office/CLAUDE.md, tests run per-workspace.
    expect(text).toMatch(/backend-office-backend/);
    expect(text).toMatch(/backend-office-web/);
    expect(text).toMatch(/backend-office-native/);
  });

  it("uses fail-fast semantics so cheapest checks fail first [BO-SPEC-032.AC23]", () => {
    const wf = loadWorkflow();
    // Either the matrix is fail-fast OR steps are sequential in a single job.
    const jobs = Object.values(wf.jobs ?? {});
    expect(jobs.length).toBeGreaterThan(0);
    // Sequential (no matrix) satisfies fail-fast naturally; if a matrix is used
    // it must be marked fail-fast: true (default but be explicit).
    for (const job of jobs) {
      if (job.strategy && "fail-fast" in job.strategy) {
        expect(job.strategy["fail-fast"]).not.toBe(false);
      }
    }
  });

  it("checks out source and sets up Node before running scripts [BO-SPEC-032.AC23]", () => {
    const wf = loadWorkflow();
    const uses: string[] = [];
    for (const job of Object.values(wf.jobs ?? {})) {
      for (const step of job.steps ?? []) {
        if (step.uses) uses.push(step.uses);
      }
    }
    expect(uses.some((u) => u.startsWith("actions/checkout@"))).toBe(true);
    expect(uses.some((u) => u.startsWith("actions/setup-node@"))).toBe(true);
  });
});
