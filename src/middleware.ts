import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

const PROTECTED: Array<{ match: RegExp; bucket: keyof typeof RATE_BUDGETS }> = [
  { match: /^\/api\/v1\/ai\//, bucket: "ai" },
  { match: /^\/api\/v1\/tickets\/scan/, bucket: "scan" },
  { match: /^\/api\/v1\/webhooks\//, bucket: "webhook" },
  { match: /^\/login|^\/signup|^\/forgot-password|^\/reset-password|^\/auth\//, bucket: "auth" },
];

function newRequestId(): string {
  // nanoid-compatible id w/o dep
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = request.headers.get("x-request-id") ?? newRequestId();

  for (const rule of PROTECTED) {
    if (rule.match.test(pathname)) {
      const budget = RATE_BUDGETS[rule.bucket];
      const key = keyFromRequest(request, `${rule.bucket}:${pathname}`);
      const result = ratelimit({ key, ...budget });
      if (!result.ok) {
        const retryAfterSeconds = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
        return new NextResponse(
          JSON.stringify({
            ok: false,
            error: {
              code: "rate_limited",
              message: "Too many requests — please try again shortly.",
              bucket: rule.bucket,
              retryAfter: retryAfterSeconds,
            },
          }),
          {
            status: 429,
            headers: {
              "content-type": "application/json",
              "retry-after": String(retryAfterSeconds),
              "x-ratelimit-bucket": rule.bucket,
              "x-ratelimit-remaining": "0",
              "x-ratelimit-reset": String(result.resetAt),
              "x-request-id": requestId,
            },
          },
        );
      }
    }
  }

  const response = await updateSession(request);
  response.headers.set("x-request-id", requestId);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|service-worker.js|manifest.json|icon-.*\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
