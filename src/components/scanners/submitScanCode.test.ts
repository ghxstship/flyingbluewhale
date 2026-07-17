import { beforeEach, describe, expect, it, vi } from "vitest";

const postFieldWrite = vi.hoisted(() => vi.fn());
const scanFeedback = vi.hoisted(() => vi.fn());

vi.mock("@/lib/offline/outbox", () => ({ postFieldWrite }));
vi.mock("@/lib/haptics", () => ({ scanFeedback }));

import { MISREAD_MESSAGE, submitScanCode } from "./submitScanCode";

/** A real UPC-A whose check digit verifies (Tito's). */
const VALID_UPC = "619947000020";
/** Well-formed shape, but the check digit does NOT verify — a misread. */
const MISREAD_UPC = "082184090563";

beforeEach(() => {
  postFieldWrite.mockReset();
  scanFeedback.mockReset();
});

describe("submitScanCode — the misread guard", () => {
  it("rejects a bad-check-digit GTIN WITHOUT hitting the network", () => {
    // The whole point: a misread must never reach a resolver, and must never
    // reach a metered external lookup once one exists.
    return submitScanCode(MISREAD_UPC, { format: "ean_13", mode: "pos" }).then((outcome) => {
      expect(postFieldWrite).not.toHaveBeenCalled();
      expect(outcome).toEqual({ kind: "error", message: MISREAD_MESSAGE });
      expect(scanFeedback).toHaveBeenCalledWith("error");
    });
  });

  it("lets a valid GTIN through", async () => {
    postFieldWrite.mockResolvedValue({ status: "ok", data: { result: "not_found", source: "unknown" } });
    await submitScanCode(VALID_UPC, { format: "upc_a", mode: "pos" });
    expect(postFieldWrite).toHaveBeenCalledOnce();
  });

  it("does NOT checksum-gate non-GTIN symbologies", async () => {
    // A QR wristband payload is not a GTIN. Running it through mod-10 would
    // reject every credential in the org.
    postFieldWrite.mockResolvedValue({ status: "ok", data: { result: "accepted" } });
    await submitScanCode("WRISTBAND-XYZ-001", { format: "qr_code", mode: "access" });
    expect(postFieldWrite).toHaveBeenCalledOnce();
  });

  it("sends code, format and mode on the wire", async () => {
    postFieldWrite.mockResolvedValue({ status: "ok", data: { result: "accepted" } });
    await submitScanCode(VALID_UPC, { format: "upc_a", mode: "pos" });
    expect(postFieldWrite).toHaveBeenCalledWith("/api/v1/scan", {
      code: VALID_UPC,
      format: "upc_a",
      mode: "pos",
    });
  });

  it("trims, and ignores an empty code", async () => {
    expect(await submitScanCode("   ", { mode: "any" })).toBeNull();
    expect(postFieldWrite).not.toHaveBeenCalled();
  });
});

describe("submitScanCode — outcome mapping", () => {
  it("an identified asset is a success cue, not a miss", async () => {
    // Operators at a gate are listening, not reading: resolver 2 finding a
    // forklift must not sound like a rejection.
    postFieldWrite.mockResolvedValue({ status: "ok", data: { result: "asset", source: "asset" } });
    const outcome = await submitScanCode("R7-014", { mode: "asset" });
    expect(outcome).toMatchObject({ kind: "result" });
    expect(scanFeedback).toHaveBeenCalledWith("success");
  });

  it("QUEUED IS NOT ACCEPTED — it gets the cautionary cue", async () => {
    // A queued scan has not been checked against the roster. Presenting it as
    // an accept would wave an unverified guest through the gate.
    postFieldWrite.mockResolvedValue({ status: "queued" });
    const outcome = await submitScanCode(VALID_UPC, { format: "upc_a", mode: "pos" });
    expect(outcome).toEqual({ kind: "queued", code: VALID_UPC });
    expect(scanFeedback).toHaveBeenCalledWith("warning");
    expect(scanFeedback).not.toHaveBeenCalledWith("success");
  });

  it("a rejection sounds like an error", async () => {
    postFieldWrite.mockResolvedValue({ status: "ok", data: { result: "voided" } });
    await submitScanCode(VALID_UPC, { format: "upc_a", mode: "pos" });
    expect(scanFeedback).toHaveBeenCalledWith("error");
  });

  it("a duplicate is cautionary, not an error", async () => {
    postFieldWrite.mockResolvedValue({ status: "ok", data: { result: "duplicate" } });
    await submitScanCode(VALID_UPC, { format: "upc_a", mode: "pos" });
    expect(scanFeedback).toHaveBeenCalledWith("warning");
  });

  it("surfaces a real server error", async () => {
    postFieldWrite.mockResolvedValue({ status: "error", message: "Forbidden" });
    const outcome = await submitScanCode(VALID_UPC, { format: "upc_a", mode: "pos" });
    expect(outcome).toEqual({ kind: "error", message: "Forbidden" });
  });
});
