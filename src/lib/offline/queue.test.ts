import { describe, it, expect, beforeEach, vi } from "vitest";
import { enqueue, list, remove, size, flush, type QueuedItem } from "./queue";

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
