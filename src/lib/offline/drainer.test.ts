// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "fake-indexeddb/auto";
import {
  __resetReplayers,
  drainAppQueue,
  registerPrefixReplayer,
  registerReplayer,
  replayerFor,
} from "./drainer";
import { enqueue, failedCount, list, size, type QueuedItem } from "./queue";
import { REPLAY_KINDS } from "./replay-codec";

/**
 * The app-level drainer (T1-1). The property that justifies its existence:
 * a queued write replays with NO surface mounted — before this, an incident
 * filed offline only replayed if the crew member reopened the incident form
 * after reconnecting. These tests drive `drainAppQueue()` headlessly (no
 * component, no hook) against mock replayers, which is exactly the situation
 * on reconnect when the crew member is three screens away.
 */

const item = (id: string, kind: string, payload: unknown = {}): QueuedItem => ({
  id,
  kind,
  payload,
  queuedAt: 1,
});

beforeEach(() => {
  window.localStorage.clear();
  __resetReplayers();
});
afterEach(() => __resetReplayers());

describe("drainAppQueue", () => {
  it("drains queued items with no origin surface mounted", async () => {
    const sent: string[] = [];
    registerReplayer("incident", async (q) => {
      sent.push(q.id);
      return "ok";
    });
    enqueue(item("i1", "incident"));
    enqueue(item("i2", "incident"));
    const res = await drainAppQueue();
    expect(res.flushed).toBe(2);
    expect(sent).toEqual(["i1", "i2"]); // FIFO
    expect(size()).toBe(0);
  });

  it("drains every registered kind in one pass, leaves unregistered kinds alone", async () => {
    registerReplayer("incident", async () => "ok");
    registerReplayer("handover", async () => "ok");
    enqueue(item("a", "incident"));
    enqueue(item("b", "handover"));
    enqueue(item("c", "some-surface-owned-kind"));
    const res = await drainAppQueue();
    expect(res.flushed).toBe(2);
    expect(list().map((q) => q.id)).toEqual(["c"]);
  });

  it("terminal rejection parks the item as failed and CONTINUES to later items", async () => {
    registerReplayer("incident", async (q) =>
      q.id === "bad" ? { error: "Validation rejected" } : "ok",
    );
    enqueue(item("bad", "incident"));
    enqueue(item("good", "incident"));
    const res = await drainAppQueue();
    expect(res.flushed).toBe(1);
    expect(res.failed).toBe(1);
    expect(failedCount()).toBe(1);
    expect(list("incident").map((q) => q.id)).toEqual(["bad"]);
    // A second drain skips the parked row instead of hammering it.
    const replay = vi.fn().mockResolvedValue("ok");
    registerReplayer("incident", replay);
    await drainAppQueue();
    expect(replay).not.toHaveBeenCalled();
  });

  it("a transient throw stops that kind (FIFO holds) without touching other kinds", async () => {
    const calls: string[] = [];
    registerReplayer("incident", async (q) => {
      calls.push(q.id);
      throw new Error("network");
    });
    registerReplayer("handover", async (q) => {
      calls.push(q.id);
      return "ok";
    });
    enqueue(item("i1", "incident"));
    enqueue(item("i2", "incident"));
    enqueue(item("h1", "handover"));
    const res = await drainAppQueue();
    expect(calls).toEqual(["i1", "h1"]); // i2 never attempted out of order
    expect(res.flushed).toBe(1);
    expect(res.remaining).toBe(2); // i1+i2 still queued, replayable, not failed
    expect(list("incident").map((q) => q.id)).toEqual(["i1", "i2"]);
  });

  it("prefix replayers cover dynamic kind families (chat:<roomId>)", async () => {
    const rooms: string[] = [];
    registerPrefixReplayer("chat:", async (q) => {
      rooms.push(q.kind);
      return "ok";
    });
    enqueue(item("m1", "chat:room-a"));
    enqueue(item("m2", "chat:room-b"));
    const res = await drainAppQueue();
    expect(res.flushed).toBe(2);
    expect(rooms.sort()).toEqual(["chat:room-a", "chat:room-b"]);
    expect(replayerFor("chat:anything")).not.toBeNull();
    expect(replayerFor("unrelated")).toBeNull();
  });

  it("every T1-1 replay kind resolves once the registry is populated", () => {
    for (const kind of Object.values(REPLAY_KINDS)) registerReplayer(kind, async () => "ok");
    for (const kind of Object.values(REPLAY_KINDS)) {
      expect(replayerFor(kind), `no replayer for ${kind}`).not.toBeNull();
    }
  });
});
