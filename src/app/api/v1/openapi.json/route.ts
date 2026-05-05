import { NextResponse } from "next/server";
import { buildOpenAPI } from "@/lib/openapi/build";
// Side-effect import — populates the registry before we read it.
import "@/lib/openapi/all-endpoints";

/**
 * Public OpenAPI 3.1 spec. Cacheable for 5 min on browsers, 10 min on
 * the edge — the registry only changes between deploys.
 *
 * Note: this is the spec document itself, not a typical /api/v1 envelope —
 * we serve raw JSON via `new NextResponse(...)` (the convention for
 * file/document responses; see the `no-restricted-syntax` rule on
 * NextResponse.json in /api/v1).
 */
export async function GET() {
  const doc = buildOpenAPI({
    title: "LYTEHAUS API",
    version: "1.0.0",
    description:
      "Public REST surface for LYTEHAUS Technologies (ATLVS / GVTEWAY / COMPVSS). Auth via session cookie or Bearer PAT (`/me/api-keys`). Rate limits scale with your org plan tier.",
    serverUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://lytehaus.tech",
  });
  return new NextResponse(JSON.stringify(doc), {
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=300, s-maxage=600",
    },
  });
}
