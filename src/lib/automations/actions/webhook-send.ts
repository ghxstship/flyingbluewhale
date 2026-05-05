import { z } from "zod";
import { createHmac } from "node:crypto";
import { registerAction } from "../registry";
import { httpFetch } from "@/lib/http";

const Schema = z.object({
  url: z.string().url(),
  /** HTTP method. Default POST. */
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).default("POST"),
  /** JSON body. Ignored for GET. */
  payload: z.record(z.string(), z.unknown()).default({}),
  /** Extra headers (no auth headers — supply via `secret` for HMAC). */
  headers: z.record(z.string(), z.string()).optional(),
  /** Optional shared secret. When provided, body is signed `t=<ms>,v1=<hex>` over `${ts}.${body}`. */
  secret: z.string().min(8).max(256).optional(),
  /** Override the default 8s timeout for slow endpoints. Hard cap 30s. */
  timeoutMs: z.number().int().min(500).max(30_000).optional(),
});

registerAction({
  type: "webhook.send",
  schema: Schema,
  label: "Send Webhook Request",
  description: "Posts JSON to an external URL with optional HMAC-SHA256 signing.",
  async run(input, _ctx) {
    const body = input.method === "GET" ? undefined : JSON.stringify(input.payload);
    const headers: Record<string, string> = {
      "user-agent": "lytehaus-automation/1",
      ...(input.headers ?? {}),
    };
    if (body !== undefined) headers["content-type"] = "application/json";

    if (input.secret && body !== undefined) {
      const ts = Date.now().toString();
      const sigHex = createHmac("sha256", input.secret).update(`${ts}.${body}`).digest("hex");
      headers["x-lyt-signature"] = `t=${ts},v1=${sigHex}`;
    }

    let status = 0;
    let errMsg: string | null = null;
    let responseText = "";
    try {
      const res = await httpFetch(input.url, {
        method: input.method,
        headers,
        body,
        timeoutMs: input.timeoutMs ?? 8000,
        retries: 0,
      });
      status = res.status;
      responseText = await res.text().catch(() => "");
      if (!res.ok) errMsg = `HTTP ${status}`;
    } catch (e) {
      errMsg = (e as Error).message || "fetch failed";
    }

    if (errMsg) {
      throw new Error(`webhook.send: ${errMsg}${responseText ? ` — ${responseText.slice(0, 200)}` : ""}`);
    }

    return {
      output: {
        sent: true,
        status,
        // Truncate so a verbose endpoint doesn't blow the step row up.
        responseSnippet: responseText.slice(0, 1000),
      },
    };
  },
});

export {};
