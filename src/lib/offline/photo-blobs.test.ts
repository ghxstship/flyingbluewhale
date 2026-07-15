// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import "fake-indexeddb/auto";
import {
  dropPhotos,
  MAX_QUEUED_BYTES,
  PhotoBudgetExceededError,
  putPhotos,
  queuedBytes,
  readPhotos,
  sweepOrphans,
} from "./photo-blobs";
import type { PhotoFix } from "@/lib/mobile/photo-geo";

/**
 * The offline photo sidecar.
 *
 * Every failure here is silent by construction: the crew member is told their
 * log is queued and walks away. If the bytes aren't really durable, or come
 * back attached to the wrong fix, nobody finds out until an insurance claim.
 * So the properties worth pinning are durability across a "reload" (a fresh
 * open of the same IndexedDB), index alignment between files and fixes, and
 * that nothing leaks bytes that no queued row references.
 */

/**
 * jsdom's Blob implements neither `arrayBuffer()` nor `text()`. Both are
 * standard and present in every browser this PWA targets (Safari 14+), so the
 * gap is the shim's, not the product's — polyfill it here rather than contort
 * the module around a test double. FileReader is what jsdom does implement.
 */
function readAs(blob: Blob, as: "buffer" | "text"): Promise<ArrayBuffer | string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as ArrayBuffer | string);
    r.onerror = () => reject(r.error);
    if (as === "buffer") r.readAsArrayBuffer(blob);
    else r.readAsText(blob);
  });
}
if (!Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = function arrayBuffer(this: Blob) {
    return readAs(this, "buffer") as Promise<ArrayBuffer>;
  };
}

const fix = (lat: number): PhotoFix => ({
  lat,
  lng: -80.19,
  accuracyM: 8,
  capturedAt: "2026-07-15T12:00:00.000Z",
});

const file = (name: string, body = "bytes") => new File([body], name, { type: "image/jpeg" });

const textOf = (f: File) => readAs(f, "text") as Promise<string>;

async function clearAll() {
  await sweepOrphans([]);
}

describe("photo-blobs sidecar", () => {
  beforeEach(async () => {
    await clearAll();
  });

  it("round-trips the bytes and the filename", async () => {
    const metas = await putPhotos("item-1", [file("a.jpg", "hello")], [fix(25.1)]);
    expect(metas).toHaveLength(1);

    const files = await readPhotos("item-1", metas);
    expect(files).toHaveLength(1);
    expect(files[0]!.name).toBe("a.jpg");
    expect(files[0]!.type).toBe("image/jpeg");
    expect(await textOf(files[0]!)).toBe("hello");
  });

  it("keeps each photo's fix with the right photo", async () => {
    // The whole point of the manifest: photo n's fix must survive a replay
    // still attached to photo n, not to its neighbour.
    const metas = await putPhotos("item-2", [file("a.jpg", "A"), file("b.jpg", "B")], [fix(1), fix(2)]);
    expect(metas.map((m) => m.fix?.lat)).toEqual([1, 2]);

    const files = await readPhotos("item-2", metas);
    expect(await textOf(files[0]!)).toBe("A");
    expect(await textOf(files[1]!)).toBe("B");
    expect(metas[1]!.fix?.lat).toBe(2);
  });

  it("carries a null fix through rather than dropping the photo", async () => {
    // A photo taken with GPS denied is still evidence.
    const metas = await putPhotos("item-3", [file("a.jpg")], [null]);
    expect(metas[0]!.fix).toBeNull();
    expect(await readPhotos("item-3", metas)).toHaveLength(1);
  });

  it("survives a reopen — this is the entire point", async () => {
    const metas = await putPhotos("item-4", [file("a.jpg", "persisted")], [fix(3)]);
    // Each call opens and closes its own connection, so a successful read
    // here is a read from storage, not from a live handle.
    const files = await readPhotos("item-4", metas);
    expect(await textOf(files[0]!)).toBe("persisted");
  });

  it("skips a blob that went missing instead of failing the whole replay", async () => {
    const metas = await putPhotos("item-5", [file("a.jpg"), file("b.jpg")], [fix(1), fix(2)]);
    await dropPhotos("item-5");
    // The log itself is still worth replaying without its attachments.
    expect(await readPhotos("item-5", metas)).toEqual([]);
  });

  it("drops only the submission it was asked to drop", async () => {
    const a = await putPhotos("keep", [file("a.jpg")], [fix(1)]);
    const b = await putPhotos("gone", [file("b.jpg")], [fix(2)]);
    await dropPhotos("gone");
    expect(await readPhotos("keep", a)).toHaveLength(1);
    expect(await readPhotos("gone", b)).toEqual([]);
  });

  it("sweeps bytes whose queue row is gone, and spares the ones still queued", async () => {
    // The queue is localStorage and the bytes are IndexedDB, so they drift.
    // Un-swept, orphans are invisible and permanent.
    const live = await putPhotos("still-queued", [file("a.jpg")], [fix(1)]);
    await putPhotos("orphan-1", [file("b.jpg")], [fix(2)]);
    await putPhotos("orphan-2", [file("c.jpg"), file("d.jpg")], [fix(3), fix(4)]);

    const reclaimed = await sweepOrphans(["still-queued"]);
    expect(reclaimed).toBe(3); // 1 + 2 blobs
    expect(await readPhotos("still-queued", live)).toHaveLength(1);
  });

  it("no-ops cleanly on an empty batch", async () => {
    expect(await putPhotos("item-6", [], [])).toEqual([]);
    expect(await readPhotos("item-6", [])).toEqual([]);
    await expect(dropPhotos("never-existed")).resolves.toBeUndefined();
  });
});

describe("the queue is bounded", () => {
  beforeEach(async () => {
    await sweepOrphans([]);
  });

  // Real bytes against a small injected budget — mocking `File.size` would
  // diverge from what actually lands in the store, and then the test would be
  // measuring the mock rather than the bound.
  const TEN = 10;

  it("refuses a submission that would blow the budget, and stores nothing", async () => {
    // Unbounded, a week of dead zones is invisible IndexedDB and the only
    // thing between the crew and a quota error is a catch. Refusing with a
    // sentence beats failing with a stack trace.
    await expect(putPhotos("too-big", [file("a.jpg", "x".repeat(TEN + 1))], [null], TEN)).rejects.toBeInstanceOf(
      PhotoBudgetExceededError,
    );
    // Rejected means rejected: no half-written submission left behind.
    expect(await queuedBytes()).toBe(0);
  });

  it("counts what is ALREADY queued, not just the incoming batch", async () => {
    // The budget is a total, so it has to see the backlog. Two submissions
    // that each fit alone but not together must be caught on the second.
    await putPhotos("first", [file("a.jpg", "123456")], [null], TEN);
    expect(await queuedBytes()).toBe(6);
    await expect(putPhotos("second", [file("b.jpg", "123456")], [null], TEN)).rejects.toBeInstanceOf(
      PhotoBudgetExceededError,
    );
    // The first submission is untouched by the second's rejection.
    expect(await queuedBytes()).toBe(6);
  });

  it("reports the bytes it is holding", async () => {
    expect(await queuedBytes()).toBe(0);
    await putPhotos("counted", [file("a.jpg", "12345")], [null]);
    expect(await queuedBytes()).toBe(5);
  });

  it("budgets enough room for the capture path to actually use it", () => {
    // Ties the budget to the constants that decide photo size. Raising
    // MAX_EDGE_PX (or MAX_FILES) without revisiting the budget would quietly
    // make it possible for one honest submission to exceed the whole cap.
    // A submission is at most MAX_FILES photos; the post-downscale backstop
    // in photo-upload.ts is 10MB each, which is the pessimistic bound.
    const worstCaseSubmission = 10 * 1024 * 1024 * 10; // MAX_BYTES × MAX_FILES
    expect(MAX_QUEUED_BYTES).toBeLessThan(worstCaseSubmission);
    // ...but comfortably more than a realistic one (1600px JPEGs ≈ 400KB).
    const realisticSubmission = 400 * 1024 * 10;
    expect(MAX_QUEUED_BYTES).toBeGreaterThan(realisticSubmission * 10);
  });
});
