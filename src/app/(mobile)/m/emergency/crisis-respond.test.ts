import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * crisis.respond drift guards (kit 28 backlog §3 item 1).
 *
 * The field response rides the EXISTING crisis store — `crisis_alert_receipts`
 * with the baseline's UNIQUE (alert_id, user_id, channel) — and its channel
 * values are declared in two places that nothing ties together at runtime:
 * the migration's comment/policy and the server action's Zod enum. These
 * checks keep the pair (and the offline + idempotency requirements the
 * backlog names) from drifting apart silently.
 */
const ROOT = process.cwd();
const HERE = "src/app/(mobile)/m/emergency";
const MIGRATION = "supabase/migrations/20260717130103_crisis_field_response.sql";
const NEED_HELP_MIGRATION = "supabase/migrations/20260718023356_crisis_need_help_channel.sql";

const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

describe("crisis.respond field loop", () => {
  it("ships the migration that opens the receipts write path", () => {
    const sql = read(MIGRATION);
    // The baseline shipped SELECT + UPDATE and no INSERT — without this
    // policy no field response can ever be recorded.
    expect(sql).toMatch(/create policy "crisis_alert_receipts_self_insert"/);
    expect(sql).toMatch(/for insert to authenticated/);
    // Self-write only, org-checked, and pinned to an alert of the SAME org
    // (a receipt must not pair the caller's org_id with a foreign alert).
    expect(sql).toMatch(/auth\.uid\(\)/);
    expect(sql).toMatch(/private\.is_org_member/);
    expect(sql).toMatch(/from public\.crisis_alerts/);
  });

  it("keeps the channel discriminator in lockstep between SQL and the action", () => {
    const sql = read(MIGRATION);
    const action = read(`${HERE}/actions.ts`);
    for (const channel of ["muster_ack", "self_safe"]) {
      expect(sql, `migration must document channel '${channel}'`).toContain(channel);
      expect(action, `action must accept channel '${channel}'`).toContain(channel);
    }
    // Kit 32 E1 — the third channel is documented by its own migration.
    const needHelpSql = read(NEED_HELP_MIGRATION);
    expect(needHelpSql, "need_help migration must document the channel").toContain("need_help");
    expect(action, "action must accept channel 'need_help'").toContain("need_help");
  });

  it("pushes the manager band when the holder calls for help (kit 32 E1)", () => {
    const action = read(`${HERE}/actions.ts`);
    // "Need Help" is the one response that is an alarm — the manager band
    // gets a crisis-kind push; safe/muster stay silent rows.
    expect(action).toMatch(/need_help/);
    expect(action).toMatch(/managerUserIds/);
    expect(action).toMatch(/sendPushBulk/);
    expect(action).toMatch(/kind:\s*"crisis"/);
  });

  it("renders the check-in pair with 52px targets and persisted selection", () => {
    const panel = read(`${HERE}/CrisisPanel.tsx`);
    expect(panel).toMatch(/minHeight:\s*52/);
    expect(panel).toContain("initialNeedHelpAt");
    expect(panel).toContain('"need_help"');
    const page = read(`${HERE}/page.tsx`);
    // Selection persists as real receipt rows — the page rehydrates all
    // three channels, and the manager band sees the muster tallies.
    expect(page).toContain("need_help");
    expect(page).toMatch(/m\.muster\.title/);
  });

  it("writes responses as idempotent upserts on the baseline unique key", () => {
    const action = read(`${HERE}/actions.ts`);
    // A queued response replays after reconnect; only an upsert on the
    // (alert, user, channel) key makes the replay collapse into the original.
    expect(action).toMatch(/\.upsert\(/);
    expect(action).toMatch(/onConflict:\s*"alert_id,user_id,channel"/);
  });

  it("queues both responses offline with a stable per-(alert,response) id", () => {
    const panel = read(`${HERE}/CrisisPanel.tsx`);
    // The offline requirement is the point of the surface — the network is
    // the first casualty of the day this page matters.
    expect(panel).toMatch(/useOfflineQueue/);
    // Stable id: double taps and reload-re-enqueues share one queue slot.
    expect(panel).toMatch(/\$\{QUEUE_KIND\}-\$\{alert\.id\}-\$\{response\}/);
  });

  it("renders the panel from the emergency page with full-width kit buttons", () => {
    const page = read(`${HERE}/page.tsx`);
    expect(page).toMatch(/<CrisisPanel/);
    const panel = read(`${HERE}/CrisisPanel.tsx`);
    // Full-width thumb targets, kit .ps-btn — the backlog's own words.
    expect(panel).toMatch(/ps-btn--lg/);
    expect(panel).toMatch(/width:\s*"100%"/);
  });
});
