import { NextResponse } from "next/server";
import { z, ZodError } from "zod";

export type ApiErrorCode =
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "internal"
  | "service_unavailable";

const STATUS: Record<ApiErrorCode, number> = {
  bad_request: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  rate_limited: 429,
  internal: 500,
  service_unavailable: 503,
};

export function apiOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, { status: 200, ...init });
}

export function apiCreated<T>(data: T) {
  return NextResponse.json({ ok: true, data }, { status: 201 });
}

export function apiError(code: ApiErrorCode, message: string, details?: unknown) {
  // 5xx hygiene: the dominant route pattern is `apiError("internal",
  // error.message)`, which leaks raw Postgres/driver detail (constraint
  // names, column names, occasionally RLS policy text) to API clients.
  // In production, log the real message server-side and return a generic
  // one. 4xx messages are user-correctable and pass through unchanged;
  // dev keeps full detail for debugging.
  if (code === "internal" && process.env.NODE_ENV === "production") {
    console.error("[api:internal]", message, details ?? "");
    return NextResponse.json(
      { ok: false, error: { code, message: "Something went wrong on our side. The error has been logged." } },
      { status: STATUS[code] },
    );
  }
  return NextResponse.json({ ok: false, error: { code, message, details } }, { status: STATUS[code] });
}

export async function parseJson<S extends z.ZodTypeAny>(req: Request, schema: S): Promise<z.infer<S> | NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("bad_request", "Invalid JSON body");
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    return apiError("bad_request", "Validation failed", flattenZod(result.error));
  }
  return result.data;
}

function flattenZod(err: ZodError) {
  return err.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
}
