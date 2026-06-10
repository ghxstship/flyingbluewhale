import { z, type ZodTypeAny } from "zod";
import { endpointRegistry, type EndpointDescriptor } from "./registry";

/**
 * Minimal OpenAPI 3.1 doc builder.
 *
 * Walks the in-memory `endpointRegistry` and emits a spec from the Zod
 * schemas attached to each entry. Uses `z.toJSONSchema()` (Zod 4 core, no
 * extra dep) as the primary converter and falls back to a hand-rolled
 * walker for the few shapes the converter rejects (e.g. plain query-param
 * primitives in OpenAPI parameter context).
 */

export type OpenAPIDocument = {
  openapi: string;
  info: { title: string; version: string; description?: string };
  servers: Array<{ url: string; description?: string }>;
  paths: Record<string, unknown>;
  components: { securitySchemes?: Record<string, unknown> };
};

type JsonSchema = Record<string, unknown>;

const DEFAULT_SECURITY_SCHEMES = {
  sessionCookie: {
    type: "apiKey",
    in: "cookie",
    name: "sb-access-token",
    description: "Supabase session cookie set by the browser auth flow.",
  },
  bearerToken: {
    type: "http",
    scheme: "bearer",
    bearerFormat: "PAT",
    description: "Personal access token issued at /me/api-keys (`pat_*` or `sk_*`).",
  },
} as const;

/**
 * Convert a Zod schema → JSON Schema. Tries `z.toJSONSchema` first, falls
 * back to the inline walker on any error (some Zod 4 shapes — refinements,
 * lazy unions, transforms — throw from the converter).
 */
export function zodToJsonSchema(schema: ZodTypeAny): JsonSchema {
  try {
    // `z.toJSONSchema` produces draft-2020-12; OpenAPI 3.1 is compatible
    // (it explicitly aligns to the same draft). Strip the `$schema` key
    // because OpenAPI emits it at the doc level, not per-field.
    // Use unrepresentable: "any" so unsupported nodes fall through to {} rather than throwing.
    const out = z.toJSONSchema(schema, { unrepresentable: "any" }) as JsonSchema;
    delete out.$schema;
    return out;
  } catch {
    return walk(schema);
  }
}

/**
 * Hand-rolled fallback walker. Covers the cases listed in the Phase 5.5
 * spec — string/number/boolean/enum/object/array, optional+nullable
 * unwrapping. Anything else collapses to `{}`.
 */
function walk(schema: z.core.$ZodType): JsonSchema {
  // The schema may be wrapped in optional/nullable; unwrap until we hit
  // the inner type. OpenAPI handles "optional" via the `required` array
  // on the parent object, not on the field itself.
  //
  // `_zod.def` is Zod 4's typed internals surface — the base def only
  // carries the `type` discriminator, so each branch narrows to the
  // published per-kind def interface from `z.core`.
  const def = schema._zod.def;
  const t = def.type;

  if (t === "optional" || t === "nullable" || t === "default") {
    const inner = (def as z.core.$ZodOptionalDef | z.core.$ZodNullableDef | z.core.$ZodDefaultDef).innerType;
    if (inner) return walk(inner);
    return {};
  }

  if (t === "string") {
    const node: JsonSchema = { type: "string" };
    const checks = (def as z.core.$ZodStringDef).checks;
    for (const c of checks ?? []) {
      const cd = c._zod?.def as { check?: string; format?: string; minimum?: number; maximum?: number } | undefined;
      if (!cd) continue;
      if (cd.check === "string_format" && cd.format) {
        if (["email", "url", "uuid", "datetime", "date", "time"].includes(cd.format)) {
          node.format = cd.format === "datetime" ? "date-time" : cd.format;
        }
      }
      if (cd.check === "min_length" && typeof cd.minimum === "number") node.minLength = cd.minimum;
      if (cd.check === "max_length" && typeof cd.maximum === "number") node.maxLength = cd.maximum;
    }
    return node;
  }

  if (t === "number") {
    const node: JsonSchema = { type: "number" };
    const checks = (def as z.core.$ZodNumberDef).checks;
    for (const c of checks ?? []) {
      const cd = c._zod?.def as { check?: string; value?: number; format?: string; inclusive?: boolean } | undefined;
      if (!cd) continue;
      if (cd.check === "greater_than" && typeof cd.value === "number") {
        if (cd.inclusive) node.minimum = cd.value;
        else node.exclusiveMinimum = cd.value;
      }
      if (cd.check === "less_than" && typeof cd.value === "number") {
        if (cd.inclusive) node.maximum = cd.value;
        else node.exclusiveMaximum = cd.value;
      }
      if (cd.check === "number_format" && (cd.format === "safeint" || cd.format === "int32")) {
        node.type = "integer";
      }
    }
    return node;
  }

  if (t === "boolean") return { type: "boolean" };

  if (t === "enum") {
    const entries = (def as z.core.$ZodEnumDef).entries;
    const values = entries ? Object.values(entries) : [];
    return { type: "string", enum: values };
  }

  if (t === "array") {
    const el = (def as z.core.$ZodArrayDef).element;
    return { type: "array", items: el ? walk(el) : {} };
  }

  if (t === "object") {
    const shape = (def as z.core.$ZodObjectDef).shape ?? {};
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];
    for (const [key, value] of Object.entries(shape)) {
      properties[key] = walk(value);
      const innerType = value._zod.def.type;
      if (innerType !== "optional" && innerType !== "default") {
        required.push(key);
      }
    }
    const out: JsonSchema = { type: "object", properties };
    if (required.length > 0) out.required = required;
    return out;
  }

  return {};
}

/**
 * Determine which security schemes apply to an endpoint based on its
 * `auth` field. Returns the OpenAPI `security` requirement array.
 */
function securityFor(auth: EndpointDescriptor["auth"]): Array<Record<string, string[]>> | undefined {
  switch (auth ?? "both") {
    case "none":
      return [];
    case "session":
      return [{ sessionCookie: [] }];
    case "pat":
      return [{ bearerToken: [] }];
    case "both":
    default:
      return [{ sessionCookie: [] }, { bearerToken: [] }];
  }
}

function pathItemForEndpoint(d: EndpointDescriptor): Record<string, unknown> {
  const parameters: Array<Record<string, unknown>> = [];

  for (const [name, schema] of Object.entries(d.pathParams ?? {})) {
    parameters.push({
      name,
      in: "path",
      required: true,
      schema: zodToJsonSchema(schema),
    });
  }
  for (const [name, schema] of Object.entries(d.queryParams ?? {})) {
    const isOptional = schema._zod.def.type === "optional";
    parameters.push({
      name,
      in: "query",
      required: !isOptional,
      schema: zodToJsonSchema(schema),
    });
  }

  const operation: Record<string, unknown> = {
    summary: d.summary,
    tags: d.tags ?? [],
    parameters,
    responses: Object.fromEntries(
      Object.entries(d.responses).map(([status, r]) => {
        const responseObj: Record<string, unknown> = { description: r.description };
        if (r.schema) {
          responseObj.content = { "application/json": { schema: zodToJsonSchema(r.schema) } };
        }
        return [String(status), responseObj];
      }),
    ),
  };

  if (d.description) operation.description = d.description;

  if (d.requestBody && (d.method === "POST" || d.method === "PATCH" || d.method === "PUT")) {
    operation.requestBody = {
      required: true,
      content: { "application/json": { schema: zodToJsonSchema(d.requestBody) } },
    };
  }

  const security = securityFor(d.auth);
  if (security !== undefined) operation.security = security;

  if (d.minTier && d.minTier !== "free") {
    operation["x-min-tier"] = d.minTier;
  }

  return operation;
}

export function buildOpenAPI(opts: {
  title: string;
  version: string;
  serverUrl: string;
  description?: string;
}): OpenAPIDocument {
  const paths: Record<string, Record<string, unknown>> = {};

  // Group registry entries by path so multiple methods (GET + POST) share
  // a single path-item object.
  for (const d of endpointRegistry) {
    const pathKey = `/api/v1${d.path.startsWith("/") ? d.path : `/${d.path}`}`;
    if (!paths[pathKey]) paths[pathKey] = {};
    paths[pathKey][d.method.toLowerCase()] = pathItemForEndpoint(d);
  }

  return {
    openapi: "3.1.0",
    info: {
      title: opts.title,
      version: opts.version,
      ...(opts.description ? { description: opts.description } : {}),
    },
    servers: [{ url: opts.serverUrl, description: "Production" }],
    paths,
    components: {
      securitySchemes: DEFAULT_SECURITY_SCHEMES,
    },
  };
}
