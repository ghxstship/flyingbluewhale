// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import "fake-indexeddb/auto";
import {
  dropPhotoBatch,
  enqueuePhoto,
  enqueuePhotoBatch,
  photoStates,
  readPhotoBatch,
} from "./photo-outbox";
import { sweepOrphans } from "./photo-blobs";
import type { PhotoFix } from "@/lib/mobile/photo-geo";

/**
 * The shared photo outbox (T1-1) — the daily-log sidecar generalized to any
 * surface. Properties pinned: a full round-trip (park → read back as Files
 * with names/types/fix alignment intact), per-photo state honesty (states
 * come from the store, never fabricated), append semantics for incremental
 * single-photo enqueues, and cleanup.
 */

// jsdom's Blob lacks arrayBuffer(); polyfill via FileReader (same shim the
// photo-blobs suite uses).
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
  capturedAt: "2026-07-23T12:00:00.000Z",
});
const file = (name: string, body = "bytes") => new File([body], name, { type: "image/jpeg" });
const textOf = (f: File) => readAs(f, "text") as Promise<string>;

beforeEach(async () => {
  await sweepOrphans([]); // empty the shared store between cases
});

describe("photo outbox", () => {
  it("round-trips a batch: files, names, types and fixes survive", async () => {
    const metas = await enqueuePhotoBatch(
      "incident",
      "incident-1",
      [file("a.jpg", "AAA"), file("b.jpg", "BBB")],
      [fix(25.76), null],
    );
    expect(metas.map((m) => m.surface)).toEqual(["incident", "incident"]);
    expect(metas.map((m) => m.n)).toEqual([0, 1]);
    expect(metas[0]?.fix?.lat).toBe(25.76);
    expect(metas[1]?.fix).toBeNull();

    const files = await readPhotoBatch("incident-1", metas);
    expect(files.map((f) => f.name)).toEqual(["a.jpg", "b.jpg"]);
    expect(files.map((f) => f.type)).toEqual(["image/jpeg", "image/jpeg"]);
    expect(await textOf(files[0]!)).toBe("AAA");
    expect(await textOf(files[1]!)).toBe("BBB");
  });

  it("batches are isolated per record ref (two surfaces cannot collide)", async () => {
    const a = await enqueuePhotoBatch("incident", "rec-a", [file("a.jpg", "A")], [null]);
    const b = await enqueuePhotoBatch("handover", "rec-b", [file("b.jpg", "B")], [null]);
    expect(await textOf((await readPhotoBatch("rec-a", a))[0]!)).toBe("A");
    expect(await textOf((await readPhotoBatch("rec-b", b))[0]!)).toBe("B");
    await dropPhotoBatch("rec-a");
    expect(await readPhotoBatch("rec-a", a)).toEqual([]);
    expect((await readPhotoBatch("rec-b", b)).length).toBe(1); // untouched
  });

  it("enqueuePhoto appends behind an existing batch instead of clobbering #0", async () => {
    const batch = await enqueuePhotoBatch("custody", "rec-c", [file("first.jpg", "1")], [null]);
    const single = await enqueuePhoto("custody", "rec-c", new Blob(["2"], { type: "image/png" }), {
      filename: "second.png",
    });
    expect(single.n).toBe(1);
    expect(single.surface).toBe("custody");
    const files = await readPhotoBatch("rec-c", [...batch, single]);
    expect(files.map((f) => f.name)).toEqual(["first.jpg", "second.png"]);
    expect(await textOf(files[1]!)).toBe("2");
  });

  it("photoStates reports queued vs missing from the store itself", async () => {
    const metas = await enqueuePhotoBatch("lost-found", "rec-d", [file("x.jpg"), file("y.jpg")], [null, null]);
    let states = await photoStates("rec-d", metas);
    expect(states.map((s) => s.state)).toEqual(["queued", "queued"]);
    await dropPhotoBatch("rec-d");
    states = await photoStates("rec-d", metas);
    expect(states.map((s) => s.state)).toEqual(["missing", "missing"]);
  });
});
