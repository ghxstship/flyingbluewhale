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

const IS_PROD = process.env.NODE_ENV === "production";

export function apiOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, { status: 200, ...init });
}

export function apiCreated<T>(data: T) {
  return NextResponse.json({ ok: true, data }, { status: 201 });
}

/**
 * apiError — in production, `details` is always stripped and the `message`
 * for 5xx codes is replaced with a generic string so internal implementation
 * details (DB error text, file paths, SQL hints) never reach the client.
 * In non-production environments the full message+details are passed through
 * to ease debugging.
 */
export function apiError(code: ApiErrorCode, message: string, details?: unknown) {
  const isServerError = STATUS[code] >= 500;
  const safeMessage = IS_PROD && isServerError ? "An internal error occurred" : message;
  const safeDetails = IS_PROD ? undefined : details;
  return NextResponse.json({ ok: false, error: { code, message: safeMessage, details: safeDetails } }, { status: STATUS[code] });
}

/**
 * parseJson — validates the `Content-Type` header before attempting to parse
 * the body, then runs the provided Zod schema over the result.  Returns the
 * validated data on success or a NextResponse 4xx error envelope on failure.
 */
export async function parseJson<S extends z.ZodTypeAny>(req: Request, schema: S): Promise<z.infer<S> | NextResponse> {
  const ct = req.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    return apiError("bad_request", "Content-Type must be application/json");
  }
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
