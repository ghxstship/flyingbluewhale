import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { REPLAY_KINDS } from "./replay-codec";

/**
 * T1-1 coverage ratchet — the app-layer replay registry.
 *
 * Same dual-list necessity as the SW QUEUEABLE_ENDPOINTS parity test above
 * it in this directory: a surface can enqueue under a kind (`useQueuedAction`
 * / `useOfflineQueue`) that NO replayer covers, and nothing else would
 * notice — the write queues, the drainer skips it, and it replays only if
 * the origin form happens to be remounted. That is exactly the pre-T1-1
 * behavior this layer exists to end, so the wiring is pinned by source
 * inspection (the registry module imports server actions, which can't be
 * imported into a unit test without dragging the server graph in).
 */
const src = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

describe("app-layer replay coverage (T1-1)", () => {
  const replayers = src("src/lib/offline/replayers.ts");

  it("registers a replayer for every REPLAY_KINDS entry", () => {
    for (const name of Object.keys(REPLAY_KINDS)) {
      expect(
        replayers.includes(`registerReplayer(REPLAY_KINDS.${name},`),
        `replayers.ts does not register REPLAY_KINDS.${name}`,
      ).toBe(true);
    }
  });

  it("covers the chat kind family via the prefix replayer", () => {
    expect(replayers).toContain('registerPrefixReplayer("chat:"');
  });

  it("each offline-durable surface enqueues under a registered kind", () => {
    const surfaces: Array<[string, string]> = [
      ["src/app/(mobile)/m/incidents/new/page.tsx", "REPLAY_KINDS.incident"],
      ["src/app/(mobile)/m/incident/new/QuickFileForm.tsx", "REPLAY_KINDS.incidentQuick"],
      ["src/app/(mobile)/m/lost-found/new/page.tsx", "REPLAY_KINDS.lostFound"],
      ["src/app/(mobile)/m/handover/new/page.tsx", "REPLAY_KINDS.handover"],
    ];
    for (const [path, kindRef] of surfaces) {
      const source = src(path);
      expect(source, `${path} lost its useQueuedAction wiring`).toContain("useQueuedAction");
      expect(source, `${path} does not enqueue under ${kindRef}`).toContain(kindRef);
    }
    // Daily-log predates the registry and enqueues under the literal kind.
    expect(src("src/app/(mobile)/m/daily-log/new/DailyLogForm.tsx")).toContain('"daily-log"');
    expect(REPLAY_KINDS.dailyLog).toBe("daily-log");
  });

  it("the drainer island is mounted in the (mobile) shell layout", () => {
    const layout = src("src/app/(mobile)/layout.tsx");
    expect(layout).toContain("OfflineDrainer");
    expect(layout).toMatch(/<OfflineDrainer\s*\/>/);
  });

  it("the drainer island imports the replayer registrations", () => {
    const island = src("src/components/mobile/OfflineDrainer.tsx");
    expect(island).toContain('import "@/lib/offline/replayers"');
  });

  it("the shared byte-store sweep passes ALL queued ids, not one kind's", () => {
    // Sweeping with a single kind's ids would reclaim photos other surfaces'
    // queued rows still reference — the one cross-surface hazard of sharing
    // the sidecar store.
    const dailyLog = src("src/app/(mobile)/m/daily-log/new/DailyLogForm.tsx");
    expect(dailyLog).not.toMatch(/sweepOrphans\(list\(QUEUE_KIND\)/);
    const drainer = src("src/lib/offline/drainer.ts");
    expect(drainer).toMatch(/sweepOrphans\(list\(\)\.map/);
  });
});
