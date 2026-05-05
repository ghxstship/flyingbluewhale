import { describe, it, expect, vi, beforeEach } from "vitest";

// =============================================================================
// In-memory fake of the supabase service-role client.
// =============================================================================
//
// `dispatch.ts` uses a small subset of the Supabase JS client:
//   - .from(table).insert(row)
//   - .from(table).select(cols).is(col, val).order(...).limit(...)
//   - .from(table).select(cols).in(col, arr).eq(col, val)
//   - .from(table).update(patch).eq(col, val)
//
// The fake below implements just those, with synchronous in-memory state
// exposed as `db.tables.<name>` for assertions.

type Row = Record<string, unknown>;

function makeDb() {
  const tables: Record<string, Row[]> = {
    domain_events: [],
    automation_subscriptions: [],
    job_queue: [],
  };
  let idCounter = 0;
  const nextId = () => `00000000-0000-0000-0000-${String(++idCounter).padStart(12, "0")}`;

  function builderFor(table: string) {
    const filters: Array<(row: Row) => boolean> = [];
    let pendingInsert: Row | Row[] | null = null;
    let pendingUpdate: Row | null = null;
    let mode: "select" | "insert" | "update" | null = null;
    let orderCol: string | null = null;
    let orderAsc = true;
    let limitN: number | null = null;

    const matches = (row: Row) => filters.every((fn) => fn(row));

    const exec = async (): Promise<{ data: Row | Row[] | null; error: { message: string } | null }> => {
      if (mode === "insert" && pendingInsert) {
        const rows = Array.isArray(pendingInsert) ? pendingInsert : [pendingInsert];
        for (const r of rows) {
          // Simulate the partial unique index on (type, dedup_key).
          if (table === "job_queue" && r.dedup_key) {
            const dup = tables[table].find(
              (existing) => existing.type === r.type && existing.dedup_key === r.dedup_key,
            );
            if (dup) {
              return { data: null, error: { message: "duplicate key value violates unique constraint" } };
            }
          }
          tables[table].push({ id: r.id ?? nextId(), ...r });
        }
        return { data: rows[0] ?? null, error: null };
      }
      if (mode === "update" && pendingUpdate) {
        for (const row of tables[table]) {
          if (matches(row)) Object.assign(row, pendingUpdate);
        }
        return { data: null, error: null };
      }
      if (mode === "select") {
        let found = tables[table].filter(matches);
        if (orderCol) {
          found = [...found].sort((a, b) => {
            const av = String(a[orderCol!] ?? "");
            const bv = String(b[orderCol!] ?? "");
            return (orderAsc ? 1 : -1) * av.localeCompare(bv);
          });
        }
        if (limitN != null) found = found.slice(0, limitN);
        return { data: found, error: null };
      }
      return { data: null, error: { message: "no-op" } };
    };

    const builder = {
      select(_cols: string) {
        if (mode == null) mode = "select";
        return builder;
      },
      insert(row: Row | Row[]) {
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
        filters.push((row: Row) => row[col] === val);
        return builder;
      },
      is(col: string, val: unknown) {
        filters.push((row: Row) => (val == null ? row[col] == null : row[col] === val));
        return builder;
      },
      in(col: string, arr: unknown[]) {
        filters.push((row: Row) => arr.includes(row[col]));
        return builder;
      },
      order(col: string, opts?: { ascending?: boolean }) {
        orderCol = col;
        orderAsc = opts?.ascending ?? true;
        return builder;
      },
      limit(n: number) {
        limitN = n;
        return builder;
      },
      maybeSingle: () => exec(),
      single: () => exec(),
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
    from: (table: string) => {
      tables[table] ??= [];
      return builderFor(table);
    },
  };

  return { client, tables };
}

const db = makeDb();

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: () => db.client,
}));

vi.mock("@/lib/log", () => ({
  log: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { drainPending, emitDomainEvent } from "../automations/dispatch";

beforeEach(() => {
  db.tables.domain_events.length = 0;
  db.tables.automation_subscriptions.length = 0;
  db.tables.job_queue.length = 0;
});

describe("emitDomainEvent", () => {
  it("inserts a row into domain_events with the supplied payload", async () => {
    await emitDomainEvent({
      orgId: "org-1",
      eventType: "invoice.paid",
      payload: { amountCents: 12345 },
      sourceTable: "invoices",
      sourceId: "inv-1",
    });

    expect(db.tables.domain_events).toHaveLength(1);
    const row = db.tables.domain_events[0];
    expect(row.org_id).toBe("org-1");
    expect(row.event_type).toBe("invoice.paid");
    expect(row.source_table).toBe("invoices");
    expect(row.source_id).toBe("inv-1");
    expect(row.payload).toEqual({ amountCents: 12345 });
  });

  it("swallows insert exceptions so the originating notify path never throws", async () => {
    // Force `from` to throw on the next call.
    const original = db.client.from;
    db.client.from = () => {
      throw new Error("simulated");
    };
    await expect(emitDomainEvent({ orgId: "org-1", eventType: "x", payload: {} })).resolves.toBeUndefined();
    db.client.from = original;
  });
});

describe("drainPending", () => {
  it("enqueues an automation.run job for every matching subscription and stamps dispatched_at", async () => {
    db.tables.domain_events.push({
      id: "ev-1",
      org_id: "org-1",
      event_type: "invoice.paid",
      payload: { x: 1 },
      source_table: null,
      source_id: null,
      emitted_at: "2026-05-04T00:00:00Z",
      dispatched_at: null,
    });
    db.tables.automation_subscriptions.push({
      id: "sub-1",
      org_id: "org-1",
      automation_id: "auto-1",
      event_type: "invoice.paid",
      source_table: null,
      source_id: null,
      enabled: true,
    });
    db.tables.automation_subscriptions.push({
      id: "sub-2",
      org_id: "org-1",
      automation_id: "auto-2",
      event_type: "invoice.paid",
      source_table: null,
      source_id: null,
      enabled: true,
    });

    const result = await drainPending();
    expect(result.drained).toBe(1);
    expect(result.enqueued).toBe(2);
    expect(db.tables.job_queue).toHaveLength(2);
    expect(db.tables.job_queue.map((j) => j.dedup_key).sort()).toEqual(["auto-1:event:ev-1", "auto-2:event:ev-1"]);
    // dispatched_at stamped.
    expect(db.tables.domain_events[0].dispatched_at).toBeTruthy();
  });

  it("ignores disabled subscriptions and cross-org rows", async () => {
    db.tables.domain_events.push({
      id: "ev-1",
      org_id: "org-1",
      event_type: "invoice.paid",
      payload: {},
      source_table: null,
      source_id: null,
      emitted_at: "2026-05-04T00:00:00Z",
      dispatched_at: null,
    });
    // Different org — must be filtered out.
    db.tables.automation_subscriptions.push({
      id: "sub-other",
      org_id: "org-2",
      automation_id: "auto-other",
      event_type: "invoice.paid",
      source_table: null,
      source_id: null,
      enabled: true,
    });
    // Disabled — filtered by the `.eq("enabled", true)` query.
    db.tables.automation_subscriptions.push({
      id: "sub-disabled",
      org_id: "org-1",
      automation_id: "auto-disabled",
      event_type: "invoice.paid",
      source_table: null,
      source_id: null,
      enabled: false,
    });

    const result = await drainPending();
    expect(result.enqueued).toBe(0);
    expect(db.tables.job_queue).toHaveLength(0);
  });

  it("honors source_table filter on subscriptions", async () => {
    db.tables.domain_events.push({
      id: "ev-1",
      org_id: "org-1",
      event_type: "record.updated",
      payload: {},
      source_table: "invoices",
      source_id: null,
      emitted_at: "2026-05-04T00:00:00Z",
      dispatched_at: null,
    });
    db.tables.automation_subscriptions.push({
      id: "sub-match",
      org_id: "org-1",
      automation_id: "auto-match",
      event_type: "record.updated",
      source_table: "invoices",
      source_id: null,
      enabled: true,
    });
    db.tables.automation_subscriptions.push({
      id: "sub-mismatch",
      org_id: "org-1",
      automation_id: "auto-mismatch",
      event_type: "record.updated",
      source_table: "tickets",
      source_id: null,
      enabled: true,
    });

    const result = await drainPending();
    expect(result.enqueued).toBe(1);
    expect(db.tables.job_queue).toHaveLength(1);
    expect(db.tables.job_queue[0].payload).toMatchObject({
      automationId: "auto-match",
      triggerKind: "event",
    });
  });

  it("returns zero when there are no pending events", async () => {
    const result = await drainPending();
    expect(result).toEqual({ drained: 0, enqueued: 0 });
  });

  it("idempotency: a second drain sees no pending events", async () => {
    db.tables.domain_events.push({
      id: "ev-1",
      org_id: "org-1",
      event_type: "invoice.paid",
      payload: {},
      source_table: null,
      source_id: null,
      emitted_at: "2026-05-04T00:00:00Z",
      dispatched_at: null,
    });
    db.tables.automation_subscriptions.push({
      id: "sub-1",
      org_id: "org-1",
      automation_id: "auto-1",
      event_type: "invoice.paid",
      source_table: null,
      source_id: null,
      enabled: true,
    });

    const first = await drainPending();
    expect(first.enqueued).toBe(1);
    const second = await drainPending();
    expect(second.drained).toBe(0);
    expect(second.enqueued).toBe(0);
  });

  it("dedup_key collision (concurrent ticks) does not double-enqueue", async () => {
    db.tables.domain_events.push({
      id: "ev-1",
      org_id: "org-1",
      event_type: "invoice.paid",
      payload: {},
      source_table: null,
      source_id: null,
      emitted_at: "2026-05-04T00:00:00Z",
      dispatched_at: null,
    });
    db.tables.automation_subscriptions.push({
      id: "sub-1",
      org_id: "org-1",
      automation_id: "auto-1",
      event_type: "invoice.paid",
      source_table: null,
      source_id: null,
      enabled: true,
    });
    // Pre-seed a job with the same dedup_key — simulates a racing tick.
    db.tables.job_queue.push({
      id: "preexisting",
      type: "automation.run",
      org_id: "org-1",
      payload: {},
      dedup_key: "auto-1:event:ev-1",
    });

    const result = await drainPending();
    expect(result.drained).toBe(1);
    // No new job — the duplicate-key error is swallowed.
    expect(db.tables.job_queue).toHaveLength(1);
    expect(result.enqueued).toBe(0);
  });
});
