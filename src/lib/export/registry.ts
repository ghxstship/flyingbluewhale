import "server-only";

/**
 * Export registry — the whitelist of tables the Export Centre will dump.
 * Every entry declares:
 *   - which org-scoped table to select from
 *   - the columns to include in CSV (order matters)
 *   - a human label for the UI
 *
 * Adding a table to the registry is the minimum surface for any new
 * export route — no per-table API code is required.
 */

export type ExportTable =
  | "projects"
  | "deliverables"
  | "invoices"
  | "invoice_line_items"
  | "tasks"
  | "tickets"
  | "crew_members"
  | "vendors"
  | "audit_log";

type ExportTableMeta = {
  label: string;
  /** Columns ordered for CSV output. `*` means SELECT * (JSON only). */
  csvColumns: Array<{ key: string; header: string }>;
  /** True if this table has an `org_id` FK (almost always — check the few that don't). */
  orgScoped: boolean;
};

export const EXPORT_REGISTRY: Record<ExportTable, ExportTableMeta> = {
  projects: {
    label: "Projects",
    csvColumns: [
      { key: "id", header: "id" },
      { key: "slug", header: "slug" },
      { key: "name", header: "name" },
      { key: "status", header: "status" },
      { key: "start_date", header: "start_date" },
      { key: "end_date", header: "end_date" },
      { key: "updated_at", header: "updated_at" },
    ],
    orgScoped: true,
  },
  deliverables: {
    label: "Deliverables",
    csvColumns: [
      { key: "id", header: "id" },
      { key: "project_id", header: "project_id" },
      { key: "type", header: "type" },
      { key: "status", header: "status" },
      { key: "version", header: "version" },
      { key: "deadline", header: "deadline" },
      { key: "updated_at", header: "updated_at" },
    ],
    orgScoped: true,
  },
  invoices: {
    label: "Invoices",
    csvColumns: [
      { key: "id", header: "id" },
      { key: "number", header: "number" },
      { key: "title", header: "title" },
      { key: "currency", header: "currency" },
      { key: "amount_cents", header: "amount_cents" },
      { key: "status", header: "status" },
      { key: "issued_at", header: "issued_at" },
      { key: "due_at", header: "due_at" },
      { key: "paid_at", header: "paid_at" },
    ],
    orgScoped: true,
  },
  invoice_line_items: {
    label: "Invoice line items",
    csvColumns: [
      { key: "id", header: "id" },
      { key: "invoice_id", header: "invoice_id" },
      { key: "description", header: "description" },
      { key: "quantity", header: "quantity" },
      { key: "unit_price_cents", header: "unit_price_cents" },
    ],
    orgScoped: false,
  },
  tasks: {
    label: "Tasks",
    csvColumns: [
      { key: "id", header: "id" },
      { key: "project_id", header: "project_id" },
      { key: "title", header: "title" },
      { key: "status", header: "status" },
      { key: "priority", header: "priority" },
      { key: "assigned_to", header: "assigned_to" },
      { key: "due_at", header: "due_at" },
    ],
    orgScoped: true,
  },
  tickets: {
    label: "Tickets",
    csvColumns: [
      { key: "id", header: "id" },
      { key: "project_id", header: "project_id" },
      { key: "tier", header: "tier" },
      { key: "holder_name", header: "holder_name" },
      { key: "holder_email", header: "holder_email" },
      { key: "status", header: "status" },
    ],
    orgScoped: true,
  },
  crew_members: {
    label: "Crew roster",
    csvColumns: [
      { key: "id", header: "id" },
      { key: "name", header: "name" },
      { key: "role", header: "role" },
      { key: "phone", header: "phone" },
      { key: "email", header: "email" },
      { key: "day_rate_cents", header: "day_rate_cents" },
    ],
    orgScoped: true,
  },
  vendors: {
    label: "Vendors",
    csvColumns: [
      { key: "id", header: "id" },
      { key: "name", header: "name" },
      { key: "contact_email", header: "contact_email" },
      { key: "status", header: "status" },
    ],
    orgScoped: true,
  },
  audit_log: {
    label: "Audit log",
    csvColumns: [
      { key: "id", header: "id" },
      { key: "at", header: "at" },
      { key: "actor_email", header: "actor_email" },
      { key: "action", header: "action" },
      { key: "target_table", header: "target_table" },
      { key: "target_id", header: "target_id" },
      { key: "operation", header: "operation" },
      { key: "request_id", header: "request_id" },
    ],
    orgScoped: true,
  },
};

export function isExportTable(x: string): x is ExportTable {
  return x in EXPORT_REGISTRY;
}
