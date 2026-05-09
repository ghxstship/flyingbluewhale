/**
 * Canonical Zapier payload shapes.
 *
 * Zapier's mental model is flat records — Zaps map fields like
 * `{{step1.name}}` and don't traverse nested objects well. Each shape here
 * is the "what an action / trigger returns" contract. Triggers MUST be
 * sorted desc by `created_at` and capped at 50 rows; Zapier dedupes by
 * `id`.
 *
 * URL fields are absolute, built via `urlFor("platform", ...)` so a Zap
 * step can drop the link straight into a Slack message or email without
 * the user remembering subdomain conventions.
 *
 * These types are intentionally a *projection* of the database row, not a
 * 1:1 mapping — payloads omit RLS-internal columns (`org_id`, audit
 * timestamps that aren't useful externally) and rename a few fields for
 * Zapier-friendliness.
 */
import type { Deliverable, Expense, Invoice, Notification, Project, Task } from "@/lib/supabase/types";
import { urlFor } from "@/lib/urls";

// ─── Triggers ────────────────────────────────────────────────────────────

export type ZapierProject = {
  id: string;
  name: string;
  slug: string;
  status: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  url: string;
};

export type ZapierTicketScan = {
  id: string;
  ticket_id: string;
  scanner_id: string;
  result: string;
  scanned_at: string;
  location: { lat: number; lng: number } | null;
  url: string;
};

export type ZapierDeliverable = {
  id: string;
  project_id: string;
  type: string;
  title: string | null;
  status: string;
  version: number;
  submitted_by: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  url: string;
};

export type ZapierInvoice = {
  id: string;
  number: string;
  title: string;
  status: string;
  amount_cents: number;
  amount: number;
  currency: string;
  client_id: string | null;
  project_id: string | null;
  issued_at: string | null;
  due_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  url: string;
};

// ─── Action results ─────────────────────────────────────────────────────

export type ZapierTask = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: number;
  project_id: string | null;
  assigned_to: string | null;
  due_at: string | null;
  created_at: string;
  updated_at: string;
  url: string;
};

export type ZapierExpense = {
  id: string;
  description: string;
  category: string | null;
  status: string;
  amount_cents: number;
  amount: number;
  currency: string;
  project_id: string | null;
  submitter_id: string;
  spent_at: string;
  created_at: string;
  updated_at: string;
  url: string;
};

export type ZapierNotification = {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

// ─── Mappers ─────────────────────────────────────────────────────────────

type ProjectRow = Pick<
  Project,
  "id" | "name" | "slug" | "status" | "description" | "start_date" | "end_date" | "created_at" | "updated_at"
>;

export function toZapierProject(row: ProjectRow): ZapierProject {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    description: row.description,
    start_date: row.start_date,
    end_date: row.end_date,
    created_at: row.created_at,
    updated_at: row.updated_at,
    url: urlFor("platform", `/projects/${row.id}`),
  };
}

type TicketScanRow = {
  id: string;
  ticket_id: string;
  scanner_id: string;
  result: string;
  scanned_at: string;
  location: unknown;
};

export function toZapierTicketScan(row: TicketScanRow): ZapierTicketScan {
  return {
    id: row.id,
    ticket_id: row.ticket_id,
    scanner_id: row.scanner_id,
    result: row.result,
    scanned_at: row.scanned_at,
    location: parseLocation(row.location),
    url: urlFor("platform", `/commercial/tickets/${row.ticket_id}`),
  };
}

function parseLocation(value: unknown): { lat: number; lng: number } | null {
  if (!value || typeof value !== "object") return null;
  const v = value as { lat?: unknown; lng?: unknown; latitude?: unknown; longitude?: unknown };
  const lat = typeof v.lat === "number" ? v.lat : typeof v.latitude === "number" ? v.latitude : null;
  const lng = typeof v.lng === "number" ? v.lng : typeof v.longitude === "number" ? v.longitude : null;
  if (lat === null || lng === null) return null;
  return { lat, lng };
}

type DeliverableRow = Pick<
  Deliverable,
  | "id"
  | "project_id"
  | "type"
  | "title"
  | "status"
  | "version"
  | "submitted_by"
  | "submitted_at"
  | "reviewed_at"
  | "deadline"
  | "created_at"
  | "updated_at"
>;

export function toZapierDeliverable(row: DeliverableRow): ZapierDeliverable {
  return {
    id: row.id,
    project_id: row.project_id,
    type: row.type,
    title: row.title,
    status: row.status,
    version: row.version,
    submitted_by: row.submitted_by,
    submitted_at: row.submitted_at,
    reviewed_at: row.reviewed_at,
    deadline: row.deadline,
    created_at: row.created_at,
    updated_at: row.updated_at,
    url: urlFor("platform", `/projects/${row.project_id}/advancing/${row.id}`),
  };
}

type InvoiceRow = Pick<
  Invoice,
  | "id"
  | "number"
  | "title"
  | "status"
  | "amount_cents"
  | "currency"
  | "client_id"
  | "project_id"
  | "issued_at"
  | "due_at"
  | "paid_at"
  | "created_at"
  | "updated_at"
>;

export function toZapierInvoice(row: InvoiceRow): ZapierInvoice {
  return {
    id: row.id,
    number: row.number,
    title: row.title,
    status: row.status,
    amount_cents: row.amount_cents,
    amount: row.amount_cents / 100,
    currency: row.currency,
    client_id: row.client_id,
    project_id: row.project_id,
    issued_at: row.issued_at,
    due_at: row.due_at,
    paid_at: row.paid_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    url: urlFor("platform", `/finance/invoices/${row.id}`),
  };
}

type TaskRow = Pick<
  Task,
  | "id"
  | "title"
  | "description"
  | "status"
  | "priority"
  | "project_id"
  | "assigned_to"
  | "due_at"
  | "created_at"
  | "updated_at"
>;

export function toZapierTask(row: TaskRow): ZapierTask {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    project_id: row.project_id,
    assigned_to: row.assigned_to,
    due_at: row.due_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    url: urlFor("platform", `/tasks/${row.id}`),
  };
}

type ExpenseRow = Pick<
  Expense,
  | "id"
  | "description"
  | "category"
  | "status"
  | "amount_cents"
  | "currency"
  | "project_id"
  | "submitter_id"
  | "spent_at"
  | "created_at"
  | "updated_at"
>;

export function toZapierExpense(row: ExpenseRow): ZapierExpense {
  return {
    id: row.id,
    description: row.description,
    category: row.category,
    status: row.status,
    amount_cents: row.amount_cents,
    amount: row.amount_cents / 100,
    currency: row.currency,
    project_id: row.project_id,
    submitter_id: row.submitter_id,
    spent_at: row.spent_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    url: urlFor("platform", `/finance/expenses/${row.id}`),
  };
}

type NotificationRow = Pick<Notification, "id" | "user_id" | "title" | "body" | "href" | "read_at" | "created_at">;

export function toZapierNotification(row: NotificationRow): ZapierNotification {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    body: row.body,
    href: row.href,
    read_at: row.read_at,
    created_at: row.created_at,
  };
}

// ─── Documentation samples ───────────────────────────────────────────────

/**
 * Static example payloads surfaced on the Zapier settings page so
 * integrators can preview shapes without authenticating. These are not
 * loaded from the database — they're hand-written demos.
 */
export const ZAPIER_SAMPLES = {
  project: {
    id: "00000000-0000-0000-0000-000000000001",
    name: "MMW26 Hialeah",
    slug: "mmw26-hialeah",
    status: "active",
    description: "Salvage City — Miami Music Week 2026",
    start_date: "2026-03-21",
    end_date: "2026-03-25",
    created_at: "2026-01-15T10:23:00.000Z",
    updated_at: "2026-01-15T10:23:00.000Z",
    url: "https://atlvs.lytehaus.live/projects/00000000-0000-0000-0000-000000000001",
  } satisfies ZapierProject,
  ticket_scan: {
    id: "00000000-0000-0000-0000-000000000002",
    ticket_id: "00000000-0000-0000-0000-000000000003",
    scanner_id: "00000000-0000-0000-0000-000000000004",
    result: "ok",
    scanned_at: "2026-03-21T19:04:11.000Z",
    location: { lat: 25.8576, lng: -80.2781 },
    url: "https://atlvs.lytehaus.live/commercial/tickets/00000000-0000-0000-0000-000000000003",
  } satisfies ZapierTicketScan,
  deliverable: {
    id: "00000000-0000-0000-0000-000000000005",
    project_id: "00000000-0000-0000-0000-000000000001",
    type: "rider",
    title: "Headliner Hospitality Rider",
    status: "submitted",
    version: 2,
    submitted_by: "00000000-0000-0000-0000-000000000004",
    submitted_at: "2026-02-14T16:30:00.000Z",
    reviewed_at: null,
    deadline: "2026-03-01",
    created_at: "2026-02-10T12:00:00.000Z",
    updated_at: "2026-02-14T16:30:00.000Z",
    url: "https://atlvs.lytehaus.live/projects/00000000-0000-0000-0000-000000000001/advancing/00000000-0000-0000-0000-000000000005",
  } satisfies ZapierDeliverable,
  invoice: {
    id: "00000000-0000-0000-0000-000000000006",
    number: "INV-2026-0042",
    title: "MMW26 Deposit (60%)",
    status: "paid",
    amount_cents: 4500000,
    amount: 45000,
    currency: "USD",
    client_id: "00000000-0000-0000-0000-000000000007",
    project_id: "00000000-0000-0000-0000-000000000001",
    issued_at: "2026-01-20T00:00:00.000Z",
    due_at: "2026-02-19T00:00:00.000Z",
    paid_at: "2026-02-15T11:42:00.000Z",
    created_at: "2026-01-20T00:00:00.000Z",
    updated_at: "2026-02-15T11:42:00.000Z",
    url: "https://atlvs.lytehaus.live/finance/invoices/00000000-0000-0000-0000-000000000006",
  } satisfies ZapierInvoice,
  task: {
    id: "00000000-0000-0000-0000-000000000008",
    title: "Confirm rigging plot with venue",
    description: null,
    status: "open",
    priority: 2,
    project_id: "00000000-0000-0000-0000-000000000001",
    assigned_to: null,
    due_at: "2026-03-15T00:00:00.000Z",
    created_at: "2026-02-01T09:00:00.000Z",
    updated_at: "2026-02-01T09:00:00.000Z",
    url: "https://atlvs.lytehaus.live/tasks/00000000-0000-0000-0000-000000000008",
  } satisfies ZapierTask,
  expense: {
    id: "00000000-0000-0000-0000-000000000009",
    description: "Rental van — Day 1 load-in",
    category: "transport",
    status: "submitted",
    amount_cents: 28400,
    amount: 284,
    currency: "USD",
    project_id: "00000000-0000-0000-0000-000000000001",
    submitter_id: "00000000-0000-0000-0000-000000000004",
    spent_at: "2026-03-19",
    created_at: "2026-03-19T20:14:00.000Z",
    updated_at: "2026-03-19T20:14:00.000Z",
    url: "https://atlvs.lytehaus.live/finance/expenses/00000000-0000-0000-0000-000000000009",
  } satisfies ZapierExpense,
  notification: {
    id: "00000000-0000-0000-0000-000000000010",
    user_id: "00000000-0000-0000-0000-000000000004",
    title: "Deliverable approved: Stage Plot v2",
    body: "Your stage plot was approved by the production lead.",
    href: "/console/projects/00000000-0000-0000-0000-000000000001/advancing/00000000-0000-0000-0000-000000000005",
    read_at: null,
    created_at: "2026-02-15T14:00:00.000Z",
  } satisfies ZapierNotification,
};
