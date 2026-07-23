import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  clearFailed,
  enqueue,
  failedCount,
  flush,
  list,
  listFailed,
  markFailed,
  remove,
  size,
  type QueuedItem,
} from "./queue";

/**
 * Offline queue (kit 21 W8). jsdom provides a real localStorage, so the outbox
 * round-trips; these pin the durability + ordering + drain semantics the field
 * shells depend on.
 */
const item = (id: string, kind = "chat", payload: unknown = { body: id }): QueuedItem => ({
  id,
  kind,
  payload,
  queuedAt: 1,
});

describe("offline queue", () => {
  beforeEach(() => window.localStorage.clear());

  it("enqueues and lists in FIFO order", () => {
    enqueue(item("a"));
    enqueue(item("b"));
    expect(list("chat").map((q) => q.id)).toEqual(["a", "b"]);
    expect(size()).toBe(2);
  });

  it("is idempotent on id (double-tap doesn't duplicate)", () => {
    enqueue(item("a"));
    enqueue(item("a"));
    expect(size()).toBe(1);
  });

  it("filters list by kind", () => {
    enqueue(item("a", "chat"));
    enqueue(item("b", "daily-log"));
    expect(list("chat").map((q) => q.id)).toEqual(["a"]);
    expect(list("daily-log").map((q) => q.id)).toEqual(["b"]);
    expect(list().length).toBe(2);
  });

  it("removes by id", () => {
    enqueue(item("a"));
    enqueue(item("b"));
    remove("a");
    expect(list("chat").map((q) => q.id)).toEqual(["b"]);
  });

  it("flush drains successful sends and removes them", async () => {
    enqueue(item("a"));
    enqueue(item("b"));
    const send = vi.fn().mockResolvedValue(true);
    const n = await flush("chat", send);
    expect(n).toBe(2);
    expect(size()).toBe(0);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("flush stops at the first failure, preserving order + remaining items", async () => {
    enqueue(item("a"));
    enqueue(item("b"));
    enqueue(item("c"));
    const send = vi
      .fn()
      .mockResolvedValueOnce(true) // a
      .mockResolvedValueOnce(false); // b fails → stop
    const n = await flush("chat", send);
    expect(n).toBe(1);
    expect(list("chat").map((q) => q.id)).toEqual(["b", "c"]);
  });

  it("flush treats a throw as a failure and halts", async () => {
    enqueue(item("a"));
    enqueue(item("b"));
    const send = vi.fn().mockRejectedValue(new Error("network"));
    const n = await flush("chat", send);
    expect(n).toBe(0);
    expect(size()).toBe(2);
  });

  it("only drains the requested kind", async () => {
    enqueue(item("a", "chat"));
    enqueue(item("b", "daily-log"));
    const send = vi.fn().mockResolvedValue(true);
    await flush("chat", send);
    expect(list("chat")).toEqual([]);
    expect(list("daily-log").map((q) => q.id)).toEqual(["b"]);
  });
});

/**
 * T1-1 additions — failed-item parking + the shared per-kind drain mutex.
 * The failure mode each pins: a poisoned row wedging every later write of
 * its kind forever, and two drain paths (surface-mounted + app-level)
 * double-sending the same queued item on reconnect.
 */
describe("failed-item parking (T1-1)", () => {
  beforeEach(() => window.localStorage.clear());

  it("markFailed parks an item and flush skips it, draining the rest", async () => {
    enqueue(item("a"));
    enqueue(item("b"));
    enqueue(item("c"));
    markFailed("b", "Validation rejected");
    const send = vi.fn().mockResolvedValue(true);
    const n = await flush("chat", send);
    expect(n).toBe(2);
    expect(send).toHaveBeenCalledTimes(2);
    expect(list("chat").map((q) => q.id)).toEqual(["b"]);
    expect(failedCount()).toBe(1);
    expect(listFailed()[0]?.failed?.message).toBe("Validation rejected");
  });

  it("clearFailed re-arms parked items (attempts survive)", async () => {
    enqueue(item("a"));
    markFailed("a", "no");
    markFailed("a", "still no");
    expect(listFailed()[0]?.failed?.attempts).toBe(2);
    expect(clearFailed()).toBe(1);
    expect(failedCount()).toBe(0);
    const send = vi.fn().mockResolvedValue(true);
    expect(await flush("chat", send)).toBe(1);
  });

  it("markFailed on an unknown id is a no-op", () => {
    markFailed("ghost", "whatever");
    expect(failedCount()).toBe(0);
  });
});

describe("per-kind drain mutex (T1-1)", () => {
  beforeEach(() => window.localStorage.clear());

  it("a concurrent flush of the same kind short-circuits to 0", async () => {
    enqueue(item("a"));
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const slowSend = vi.fn().mockImplementation(async () => {
      await gate;
      return true;
    });
    const first = flush("chat", slowSend);
    const second = await flush("chat", vi.fn().mockResolvedValue(true));
    expect(second).toBe(0); // lock held — nothing double-sent
    release();
    expect(await first).toBe(1);
    expect(size()).toBe(0);
    expect(slowSend).toHaveBeenCalledTimes(1);
  });

  it("different kinds drain concurrently", async () => {
    enqueue(item("a", "chat"));
    enqueue(item("b", "daily-log"));
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const slow = vi.fn().mockImplementation(async () => {
      await gate;
      return true;
    });
    const first = flush("chat", slow);
    const other = await flush("daily-log", vi.fn().mockResolvedValue(true));
    expect(other).toBe(1);
    release();
    await first;
    expect(size()).toBe(0);
  });
});
