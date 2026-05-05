import type { ZodTypeAny } from "zod";

/**
 * Endpoint descriptor — what each `/api/v1/*` route advertises to the
 * OpenAPI spec generator.  Routes register themselves at module-import
 * time via `registerEndpoint(...)`; the spec is built lazily when
 * `/api/v1/openapi.json` is requested.
 *
 * Keep this file framework-free so it can be imported from server
 * routes, build scripts, and tests without pulling Next/Node deps.
 */
export type EndpointDescriptor = {
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  /** OpenAPI-style path, e.g. "/projects/{id}" — not the Next file path. */
  path: string;
  summary: string;
  description?: string;
  tags?: string[];
  /** Path parameters defined as Zod schemas. Keys must match path placeholders. */
  pathParams?: Record<string, ZodTypeAny>;
  /** Query parameters. */
  queryParams?: Record<string, ZodTypeAny>;
  /** Request body schema (for POST/PATCH/PUT). */
  requestBody?: ZodTypeAny;
  /** Response schemas keyed by status code. */
  responses: Record<number, { description: string; schema?: ZodTypeAny }>;
  /** Auth requirement: "session" | "pat" | "both" | "none". Default "both". */
  auth?: "session" | "pat" | "both" | "none";
  /** Plan tier requirement. Default "free" (any tier). */
  minTier?: "free" | "team" | "pro" | "enterprise";
};

/**
 * Module-scoped registry. Routes call `registerEndpoint(...)` at import
 * time so the spec builder can walk them on demand. We dedupe by
 * `${method} ${path}` so accidental double-imports (HMR, two route
 * modules sharing the same path) don't produce duplicate entries.
 */
export const endpointRegistry: EndpointDescriptor[] = [];

export function registerEndpoint(d: EndpointDescriptor): void {
  const key = `${d.method} ${d.path}`;
  const existingIdx = endpointRegistry.findIndex((e) => `${e.method} ${e.path}` === key);
  if (existingIdx >= 0) {
    endpointRegistry[existingIdx] = d;
    return;
  }
  endpointRegistry.push(d);
}

/** Test helper — clears the registry between cases. Not used in prod. */
export function __resetRegistryForTests(): void {
  endpointRegistry.length = 0;
}
