import { describe, expect, it } from "vitest";
import { z } from "zod";
import { apiCreated, apiError, apiOk, parseJson } from "./api";

describe("apiOk / apiCreated / apiError", () => {
  it("apiOk returns 200 with { ok: true, data }", async () => {
    const res = apiOk({ hello: "world" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, data: { hello: "world" } });
  });

  it("apiCreated returns 201", async () => {
    const res = apiCreated({ id: "x" });
    expect(res.status).toBe(201);
  });

  it("apiError maps codes to HTTP status", async () => {
    expect(apiError("bad_request", "bad").status).toBe(400);
    expect(apiError("unauthorized", "u").status).toBe(401);
    expect(apiError("forbidden", "f").status).toBe(403);
    expect(apiError("not_found", "n").status).toBe(404);
    expect(apiError("conflict", "c").status).toBe(409);
    expect(apiError("rate_limited", "r").status).toBe(429);
    expect(apiError("internal", "i").status).toBe(500);
  });
});

describe("parseJson", () => {
  const Schema = z.object({ name: z.string().min(1) });

  it("returns parsed data on valid input", async () => {
    const req = new Request("http://test/", { method: "POST", body: JSON.stringify({ name: "Alice" }) });
    const result = await parseJson(req, Schema);
    expect(result).toEqual({ name: "Alice" });
  });

  it("returns 400 Response on invalid JSON", async () => {
    const req = new Request("http://test/", { method: "POST", body: "{not json" });
    const result = await parseJson(req, Schema);
    expect(result).toBeInstanceOf(Response);
    if (result instanceof Response) expect(result.status).toBe(400);
  });

  it("returns 400 Response on schema failure", async () => {
    const req = new Request("http://test/", { method: "POST", body: JSON.stringify({ name: "" }) });
    const result = await parseJson(req, Schema);
    expect(result).toBeInstanceOf(Response);
    if (result instanceof Response) expect(result.status).toBe(400);
  });
});
