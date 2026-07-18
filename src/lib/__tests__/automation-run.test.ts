import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

// =============================================================================
// In-memory fake of the supabase service-role client.
// =============================================================================
//
// The runner does:
//   1. .from("automations").select("...").eq("id", id).maybeSingle()
//   2. .from("automation_runs").insert({...}).select("id").single()
//   3. .from("automation_step_runs").insert({...}).select("id").single()
//   4. .from("automation_step_runs").update({...}).eq("id", id)
//   5. .from("automation_runs").update({...}).eq("id", id)
//   6. .from("automations").update({...}).eq("id", id)
//
// We fake all six. State is exposed via `db.tables.<name>` for assertions.

type Row = Record<string, unknown>;

function makeDb() {
  const tables = {
    automations: [] as Row[],
    automation_runs: [] as Row[],
    automation_step_runs: [] as Row[],
  };
  const tableMap: Record<string, Row[]> = tables;
  const rowsFor = (table: string): Row[] => {
    const rows = tableMap[table];
    if (!rows) throw new Error(`unknown table: ${table}`);
    return rows;
  };
  let idCounter = 0;
  const nextId = () => `00000000-0000-0000-0000-${String(++idCounter).padStart(12, "0")}`;

  function builderFor(table: string) {
    const pendingFilters: Array<[string, unknown]> = [];
    let pendingInsert: Row | null = null;
    let pendingUpdate: Row | null = null;
    let mode: "select" | "insert" | "update" | null = null;

    const exec = async (): Promise<{ data: Row | Row[] | null; error: { message: string } | null }> => {
      const matches = (row: Row) => pendingFilters.every(([k, v]) => row[k] === v);

      if (mode === "insert" && pendingInsert) {
        const newRow: Row = {
          id: pendingInsert.id ?? nextId(),
          ...pendingInsert,
        };
        rowsFor(table).push(newRow);
        return { data: newRow, error: null };
      }
      if (mode === "update" && pendingUpdate) {
        const updated: Row[] = [];
        for (const row of rowsFor(table)) {
          if (matches(row)) {
            Object.assign(row, pendingUpdate);
            updated.push(row);
          }
        }
        return { data: updated[0] ?? null, error: null };
      }
      if (mode === "select") {
        const found = rowsFor(table).filter(matches);
        return { data: found[0] ?? null, error: null };
      }
      return { data: null, error: { message: "no-op" } };
    };

    const builder = {
      select(_cols: string) {
        if (mode == null) mode = "select";
        return builder;
      },
      insert(row: Row) {
        pendingInsert = row;
        mode = "insert";
        return builder;
      },
      update(patch: Row) {
        pendingUpdate = patch;
        mode = "update";
        return builder;
      },
      eq(col: string, val: unknown) {
        pendingFilters.push([col, val]);
        return builder;
      },
      maybeSingle: () => exec(),
      single: () => exec(),
      // Make awaiting the builder execute the query (used for naked `.update().eq()`).
      then(
        resolve: (v: { data: Row | Row[] | null; error: { message: string } | null }) => void,
        reject: (e: unknown) => void,
      ) {
        exec().then(resolve, reject);
      },
    };
    return builder;
  }

  const client = {
    from: (table: string) => builderFor(table),
  };

  return { client, tables };
}

const db = makeDb();

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: () => db.client,
  createClient: vi.fn(),
}));

vi.mock("@/lib/log", () => ({
  log: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// =============================================================================
// Stub the action modules so the runner finds known types but doesn't hit
// real I/O. The test imports the registry directly, registers fakes, and
// then exercises the runner.
// =============================================================================

vi.mock("@/lib/automations/actions/notify", () => ({}));
vi.mock("@/lib/automations/actions/email-send", () => ({}));
vi.mock("@/lib/automations/actions/webhook-send", () => ({}));
vi.mock("@/lib/automations/actions/record-update", () => ({}));
vi.mock("@/lib/automations/actions/delay", () => ({}));

import { runAutomation } from "../automations/run";
import { actionRegistry, registerAction } from "../automations/registry";

const noopAction = vi.fn(async () => ({ output: { ok: true } }));
const echoAction = vi.fn(async (input: unknown) => ({ output: { received: input } }));
const failingAction = vi.fn(async () => {
  throw new Error("boom");
});

registerAction({
  type: "test.noop",
  schema: z.record(z.string(), z.unknown()),
  label: "Noop",
  description: "Returns ok.",
  run: noopAction,
});
registerAction({
  type: "test.echo",
  schema: z.object({ value: z.unknown() }),
  label: "Echo",
  description: "Echoes input.",
  run: echoAction,
});
registerAction({
  type: "test.fail",
  schema: z.record(z.string(), z.unknown()),
  label: "Fail",
  description: "Always throws.",
  run: failingAction,
});
registerAction({
  type: "test.strict",
  schema: z.object({ requiredField: z.string().min(1) }),
  label: "Strict",
  description: "Validates required field.",
  run: noopAction,
});

function seedAutomation(rows: Array<Record<string, unknown>>): string {
  const id = `automation-${db.tables.automations.length + 1}`;
  db.tables.automations.push({
    id,
    org_id: "org-1",
    enabled: true,
    steps: rows,
    last_run_at: null,
    last_run_state: null,
  });
  return id;
}

beforeEach(() => {
  noopAction.mockClear();
  echoAction.mockClear();
  failingAction.mockClear();
  // Reset table state between tests.
  db.tables.automations.length = 0;
  db.tables.automation_runs.length = 0;
  db.tables.automation_step_runs.length = 0;
});

describe("runAutomation", () => {
  it("runs all steps in order and marks the run successful", async () => {
    const id = seedAutomation([
      { type: "test.noop", input: {} },
      { type: "test.echo", input: { value: 7 } },
    ]);

    const result = await runAutomation({
      automationId: id,
      triggerKind: "manual",
      triggerPayload: {},
    });

    expect(result.status).toBe("success");
    expect(result.actionCount).toBe(2);
    expect(noopAction).toHaveBeenCalledTimes(1);
    expect(echoAction).toHaveBeenCalledTimes(1);
    expect(echoAction.mock.calls[0]?.[0]).toEqual({ value: 7 });

    expect(db.tables.automation_runs).toHaveLength(1);
    expect(db.tables.automation_runs[0]?.run_state).toBe("success");
    expect(db.tables.automation_runs[0]?.action_count).toBe(2);
    expect(db.tables.automation_step_runs).toHaveLength(2);
    expect(db.tables.automation_step_runs.every((r) => r.step_state === "success")).toBe(true);
  });

  it("resolves {{trigger.*}} placeholders before validating step input", async () => {
    const id = seedAutomation([{ type: "test.echo", input: { value: "{{trigger.greeting}}" } }]);

    await runAutomation({
      automationId: id,
      triggerKind: "manual",
      triggerPayload: { greeting: "hi there" },
    });

    expect(echoAction.mock.calls[0]?.[0]).toEqual({ value: "hi there" });
  });

  it("resolves {{step.<n>.output.*}} placeholders from prior steps", async () => {
    const id = seedAutomation([
      { type: "test.echo", input: { value: 99 } },
      { type: "test.echo", input: { value: "{{step.0.output.received.value}}" } },
    ]);

    await runAutomation({ automationId: id, triggerKind: "manual" });

    expect(echoAction).toHaveBeenCalledTimes(2);
    expect(echoAction.mock.calls[1]?.[0]).toEqual({ value: 99 });
  });

  it("marks the run failed and stops on the first throwing step", async () => {
    const id = seedAutomation([
      { type: "test.noop", input: {} },
      { type: "test.fail", input: {} },
      { type: "test.noop", input: {} },
    ]);

    const result = await runAutomation({ automationId: id, triggerKind: "manual" });

    expect(result.status).toBe("failed");
    expect(result.error).toContain("boom");
    expect(result.actionCount).toBe(1);
    expect(noopAction).toHaveBeenCalledTimes(1);
    expect(failingAction).toHaveBeenCalledTimes(1);

    const run = db.tables.automation_runs[0];
    expect(run?.run_state).toBe("failed");
    expect(run?.error_summary).toContain("boom");

    const steps = db.tables.automation_step_runs;
    expect(steps).toHaveLength(2); // noop succeeded + failing step recorded
    expect(steps[0]?.step_state).toBe("success");
    expect(steps[1]?.step_state).toBe("failed");
    expect(steps[1]?.error).toContain("boom");
  });

  it("fails the run when the schema rejects resolved input", async () => {
    const id = seedAutomation([{ type: "test.strict", input: { requiredField: "" } }]);

    const result = await runAutomation({ automationId: id, triggerKind: "manual" });

    expect(result.status).toBe("failed");
    expect(noopAction).not.toHaveBeenCalled();
    expect(db.tables.automation_step_runs[0]?.step_state).toBe("failed");
    expect(db.tables.automation_step_runs[0]?.error).toContain("validation failed");
  });

  it("fails when the action type is not registered", async () => {
    const id = seedAutomation([{ type: "does.not.exist", input: {} }]);

    const result = await runAutomation({ automationId: id, triggerKind: "manual" });

    expect(result.status).toBe("failed");
    expect(result.error).toContain("unknown action type");
  });

  it("rejects disabled automations", async () => {
    const id = seedAutomation([{ type: "test.noop", input: {} }]);
    db.tables.automations[0]!.enabled = false;

    await expect(runAutomation({ automationId: id, triggerKind: "manual" })).rejects.toThrow(/disabled/);
  });

  it("uses an existing run row when one is supplied", async () => {
    const id = seedAutomation([{ type: "test.noop", input: {} }]);
    db.tables.automation_runs.push({
      id: "preexisting-run-id",
      automation_id: id,
      org_id: "org-1",
      run_state: "pending",
    });

    const result = await runAutomation({
      automationId: id,
      triggerKind: "manual",
      existingRunId: "preexisting-run-id",
    });

    expect(result.runId).toBe("preexisting-run-id");
    expect(db.tables.automation_runs).toHaveLength(1);
    expect(db.tables.automation_runs[0]?.run_state).toBe("success");
  });

  it("registry contains the registered fake actions", () => {
    // Sanity check that the registry is module-scoped and shared across tests.
    expect(actionRegistry["test.noop"]).toBeTruthy();
    expect(actionRegistry["test.echo"]).toBeTruthy();
  });

  it("skips a step whose condition resolves to false (P4.5)", async () => {
    const id = seedAutomation([
      { type: "test.noop", input: {} },
      {
        type: "test.echo",
        input: { value: "should not run" },
        condition: { field: "trigger.run", op: "is_true" },
      },
      { type: "test.noop", input: {} },
    ]);

    const result = await runAutomation({
      automationId: id,
      triggerKind: "manual",
      triggerPayload: { run: false },
    });

    expect(result.status).toBe("success");
    // The skipped step does NOT count as an action.
    expect(result.actionCount).toBe(2);
    expect(echoAction).not.toHaveBeenCalled();
    expect(noopAction).toHaveBeenCalledTimes(2);

    const stepRows = db.tables.automation_step_runs.sort((a, b) => Number(a.step_index) - Number(b.step_index));
    expect(stepRows).toHaveLength(3);
    expect(stepRows[0]?.step_state).toBe("success");
    expect(stepRows[1]?.step_state).toBe("skipped");
    expect(stepRows[2]?.step_state).toBe("success");
  });

  it("runs a step whose condition resolves to true", async () => {
    const id = seedAutomation([
      {
        type: "test.echo",
        input: { value: "yes" },
        condition: { field: "trigger.run", op: "is_true" },
      },
    ]);

    const result = await runAutomation({
      automationId: id,
      triggerKind: "manual",
      triggerPayload: { run: true },
    });

    expect(result.status).toBe("success");
    expect(result.actionCount).toBe(1);
    expect(echoAction).toHaveBeenCalledTimes(1);
  });
});
