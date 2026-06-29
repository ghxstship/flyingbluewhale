/**
 * Side-effect barrel — pull each route module that calls
 * `registerEndpoint(...)` so the registry is populated before the spec
 * is built. Imported by `/api/v1/openapi.json/route.ts`.
 *
 * Adding a new documented endpoint? Append the route's import here.
 */

import { z } from "zod";
import { registerEndpoint } from "./registry";

// Common envelopes used across the API surface.
const ErrorEnvelope = z.object({
  ok: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

const okEnvelope = (data: z.ZodTypeAny) => z.object({ ok: z.literal(true), data });

// ─── Projects ────────────────────────────────────────────────────────
const ProjectShape = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  status: z.string().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

registerEndpoint({
  method: "GET",
  path: "/projects",
  summary: "List projects",
  description: "List projects in the calling user's org. Cursor-paginated.",
  tags: ["Projects"],
  queryParams: {
    cursor: z.string().optional(),
    pageSize: z.number().int().min(1).max(200).optional(),
  },
  responses: {
    200: {
      description: "Cursor-paginated project list",
      schema: okEnvelope(
        z.object({
          orgId: z.string().uuid(),
          projects: z.array(ProjectShape),
          nextCursor: z.string().nullable(),
          pageSize: z.number().int(),
          totalCount: z.number().int(),
        }),
      ),
    },
    401: { description: "Unauthorized", schema: ErrorEnvelope },
    403: { description: "Not in an org", schema: ErrorEnvelope },
    429: { description: "Rate limited", schema: ErrorEnvelope },
  },
  auth: "both",
});

registerEndpoint({
  method: "POST",
  path: "/projects",
  summary: "Create a project",
  tags: ["Projects"],
  requestBody: z.object({
    name: z.string().min(1).max(120),
    description: z.string().max(2000).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    slug: z.string().min(1).max(48).optional(),
  }),
  responses: {
    201: { description: "Created project", schema: okEnvelope(ProjectShape) },
    400: { description: "Validation error", schema: ErrorEnvelope },
    401: { description: "Unauthorized", schema: ErrorEnvelope },
    403: { description: "Forbidden", schema: ErrorEnvelope },
    409: { description: "Slug taken", schema: ErrorEnvelope },
    429: { description: "Rate limited", schema: ErrorEnvelope },
  },
  auth: "both",
});

// ─── Tickets ─────────────────────────────────────────────────────────
registerEndpoint({
  method: "POST",
  path: "/tickets/scan",
  summary: "Scan a ticket / wristband code",
  description:
    "Records a scan event for a ticket code. Idempotent on `code` within a project. Geolocation is optional but recommended for venue analytics.",
  tags: ["Tickets"],
  requestBody: z.object({
    code: z.string().min(1),
    location: z
      .object({
        lat: z.number(),
        lng: z.number(),
        accuracy: z.number().optional(),
      })
      .optional(),
  }),
  responses: {
    200: {
      description: "Scan result (`accepted` | `duplicate` | `unknown` | `voided`)",
      schema: okEnvelope(
        z.object({
          result: z.enum(["accepted", "duplicate", "unknown", "voided", "transferred"]),
          ticketId: z.string().uuid().optional(),
          holderName: z.string().nullable().optional(),
        }),
      ),
    },
    400: { description: "Validation error", schema: ErrorEnvelope },
    401: { description: "Unauthorized", schema: ErrorEnvelope },
    403: { description: "Forbidden", schema: ErrorEnvelope },
    429: { description: "Rate limited", schema: ErrorEnvelope },
  },
  auth: "both",
});

// ─── Deliverables (signed URL) ───────────────────────────────────────
registerEndpoint({
  method: "GET",
  path: "/deliverables/{id}/download",
  summary: "Download a deliverable",
  description: "Issues a 60-second signed URL for the deliverable's stored file. Responds with HTTP 303 redirect.",
  tags: ["Deliverables"],
  pathParams: { id: z.string().uuid() },
  responses: {
    303: { description: "Redirect to signed URL" },
    400: { description: "Invalid id", schema: ErrorEnvelope },
    401: { description: "Unauthorized", schema: ErrorEnvelope },
    404: { description: "Not found", schema: ErrorEnvelope },
  },
  auth: "both",
});

// ─── Invoices PDF ────────────────────────────────────────────────────
registerEndpoint({
  method: "GET",
  path: "/invoices/{invoiceId}/pdf",
  summary: "Render an invoice as PDF",
  tags: ["Invoices"],
  pathParams: { invoiceId: z.string().uuid() },
  responses: {
    200: { description: "PDF binary (application/pdf)" },
    401: { description: "Unauthorized", schema: ErrorEnvelope },
    403: { description: "Forbidden", schema: ErrorEnvelope },
    404: { description: "Invoice not found", schema: ErrorEnvelope },
  },
  auth: "both",
});

// ─── AI Chat ─────────────────────────────────────────────────────────
registerEndpoint({
  method: "POST",
  path: "/ai/chat",
  summary: "Stream a chat completion",
  description:
    "Streams Server-Sent Events from the Anthropic models. Persists conversation + messages in `ai_conversations` / `ai_messages`. Per-user budget: 30 req/min.",
  tags: ["AI"],
  requestBody: z.object({
    conversationId: z.string().uuid().optional(),
    message: z.string().min(1).max(10_000),
    model: z.enum(["claude-opus-4-7", "claude-sonnet-4-6"]).optional(),
  }),
  responses: {
    200: { description: "Server-Sent Events stream (text/event-stream)" },
    400: { description: "Validation error", schema: ErrorEnvelope },
    401: { description: "Unauthorized", schema: ErrorEnvelope },
    429: { description: "Rate limited", schema: ErrorEnvelope },
    500: { description: "AI provider error", schema: ErrorEnvelope },
  },
  auth: "both",
  minTier: "team",
});

// ─── Webhooks: outbound endpoints ────────────────────────────────────
const WebhookEndpointShape = z.object({
  id: z.string().uuid(),
  url: z.string().url(),
  description: z.string().nullable().optional(),
  events: z.array(z.string()),
  is_active: z.boolean(),
  last_delivery_at: z.string().nullable().optional(),
  last_error: z.string().nullable().optional(),
  failure_count: z.number().int().optional(),
  created_at: z.string(),
});

registerEndpoint({
  method: "GET",
  path: "/webhooks/endpoints",
  summary: "List outbound webhook endpoints",
  tags: ["Webhooks"],
  responses: {
    200: {
      description: "List of endpoints (secrets redacted)",
      schema: okEnvelope(z.object({ endpoints: z.array(WebhookEndpointShape) })),
    },
    401: { description: "Unauthorized", schema: ErrorEnvelope },
  },
  auth: "both",
});

registerEndpoint({
  method: "POST",
  path: "/webhooks/endpoints",
  summary: "Register an outbound webhook",
  description: "Mints a fresh HMAC secret returned ONCE in the response. Subsequent GETs do not expose the secret.",
  tags: ["Webhooks"],
  requestBody: z.object({
    url: z.string().url(),
    description: z.string().max(200).optional(),
    events: z.array(z.string()).min(1),
  }),
  responses: {
    201: {
      description: "Created endpoint with one-shot secret",
      schema: okEnvelope(
        z.object({
          endpoint: WebhookEndpointShape,
          secret: z.string(),
        }),
      ),
    },
    400: { description: "Validation error", schema: ErrorEnvelope },
    401: { description: "Unauthorized", schema: ErrorEnvelope },
    403: { description: "Forbidden", schema: ErrorEnvelope },
  },
  auth: "both",
  minTier: "pro",
});

// ─── Push subscriptions ──────────────────────────────────────────────
const PushSubShape = z.object({
  id: z.string().uuid(),
  endpoint: z.string().url(),
  user_agent: z.string().nullable().optional(),
  created_at: z.string(),
  last_seen_at: z.string().nullable().optional(),
});

registerEndpoint({
  method: "GET",
  path: "/push/subscriptions",
  summary: "List the caller's web-push subscriptions",
  tags: ["Push"],
  responses: {
    200: {
      description: "Active push subscriptions for the calling user",
      schema: okEnvelope(z.object({ subscriptions: z.array(PushSubShape) })),
    },
    401: { description: "Unauthorized", schema: ErrorEnvelope },
  },
  auth: "session",
});

registerEndpoint({
  method: "POST",
  path: "/push/subscriptions",
  summary: "Register a web-push subscription",
  description:
    "Upserts by `endpoint`. The browser may re-issue the same endpoint across reloads; keys are merged in place.",
  tags: ["Push"],
  requestBody: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
    userAgent: z.string().max(512).optional(),
  }),
  responses: {
    201: {
      description: "Created or updated subscription",
      schema: okEnvelope(z.object({ subscription: PushSubShape })),
    },
    400: { description: "Validation error", schema: ErrorEnvelope },
    401: { description: "Unauthorized", schema: ErrorEnvelope },
  },
  auth: "session",
});

// ─── Subcontractor operations (v7.5) ─────────────────────────────────
const WorkOrderShape = z.object({
  id: z.string().uuid(),
  title: z.string(),
  trade: z.string(),
  work_order_state: z.string(),
  dispatch_mode: z.string(),
  visibility: z.string(),
  budget_guide_cents: z.number().int().nullable(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  awarded_vendor_id: z.string().uuid().nullable(),
});

registerEndpoint({
  method: "GET",
  path: "/work-orders",
  summary: "List work orders",
  description: "List the org's subcontractor work orders (newest first). Optional `state` filter.",
  tags: ["Work Orders"],
  queryParams: { state: z.string().optional() },
  responses: {
    200: { description: "Work order list", schema: okEnvelope(z.object({ workOrders: z.array(WorkOrderShape) })) },
    401: { description: "Unauthorized", schema: ErrorEnvelope },
  },
  auth: "session",
});

registerEndpoint({
  method: "POST",
  path: "/work-orders",
  summary: "Create a work order",
  description: "Create a draft work order to dispatch a trade crew.",
  tags: ["Work Orders"],
  requestBody: z.object({
    title: z.string().min(1).max(160),
    trade: z.string().min(1).max(80),
    siteAddress: z.string().max(300).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    budgetGuideCents: z.number().int().min(0).optional(),
    visibility: z.enum(["private", "public"]).optional(),
    dispatchMode: z.enum(["allow-offers", "firm-price", "instant-book", "assign"]).optional(),
  }),
  responses: {
    201: { description: "Created", schema: okEnvelope(z.object({ workOrder: WorkOrderShape.partial() })) },
    400: { description: "Validation error", schema: ErrorEnvelope },
    401: { description: "Unauthorized", schema: ErrorEnvelope },
  },
  auth: "session",
});

registerEndpoint({
  method: "GET",
  path: "/work-orders/{id}",
  summary: "Get a work order",
  description: "A work order with its bids and change orders.",
  tags: ["Work Orders"],
  pathParams: { id: z.string().uuid() },
  responses: {
    200: {
      description: "Work order detail",
      schema: okEnvelope(
        z.object({ workOrder: WorkOrderShape, bids: z.array(z.unknown()), changeOrders: z.array(z.unknown()) }),
      ),
    },
    401: { description: "Unauthorized", schema: ErrorEnvelope },
    404: { description: "Not found", schema: ErrorEnvelope },
  },
  auth: "session",
});

registerEndpoint({
  method: "GET",
  path: "/compliance",
  summary: "Subcontractor eligibility",
  description:
    "Derived subcontractor eligibility verdicts (blocked / expiring / eligible) per vendor × trade. Optional `trade` filter.",
  tags: ["Compliance"],
  queryParams: { trade: z.string().optional() },
  responses: {
    200: {
      description: "Eligibility verdicts",
      schema: okEnvelope(
        z.object({
          eligibility: z.array(
            z.object({ vendor_id: z.string().uuid(), trade: z.string(), verdict: z.enum(["eligible", "expiring", "blocked"]) }),
          ),
        }),
      ),
    },
    401: { description: "Unauthorized", schema: ErrorEnvelope },
  },
  auth: "session",
});
