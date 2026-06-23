/**
 * Curated subset of `SOFT_DELETABLE_TABLES` that is meaningful to surface in
 * the operator-facing Trash / recycle-bin view (P0.1). The full soft-delete
 * allowlist (69 tables in `src/lib/db/resource.ts`) includes plenty of
 * internal join/detail tables that an operator would never browse as
 * "deleted records"; this is the human-meaningful slice, in display order.
 *
 * `table` is validated server-side against SOFT_DELETABLE_TABLES before any
 * read/restore, so this list is purely a UX curation — never a trust
 * boundary.
 */
export type TrashType = { table: string; label: string };

export const TRASH_TYPES: readonly TrashType[] = [
  { table: "projects", label: "Projects" },
  { table: "assignments", label: "Assignments" },
  { table: "deliverables", label: "Deliverables" },
  { table: "invoices", label: "Invoices" },
  { table: "clients", label: "Clients" },
  { table: "proposals", label: "Proposals" },
  { table: "vendors", label: "Vendors" },
  { table: "purchase_orders", label: "Purchase Orders" },
  { table: "master_catalog_items", label: "Catalog Items" },
  { table: "equipment", label: "Equipment" },
  { table: "estimates", label: "Estimates" },
  { table: "contracts", label: "Contracts" },
  { table: "incidents", label: "Incidents" },
  { table: "announcements", label: "Announcements" },
];

/** Default tab when no `?type=` is supplied or it's unrecognized. */
export const DEFAULT_TRASH_TABLE = TRASH_TYPES[0]?.table ?? "projects";

export function isKnownTrashType(table: string | undefined | null): boolean {
  return !!table && TRASH_TYPES.some((t) => t.table === table);
}

/**
 * Best-effort display label for a soft-deleted row whose exact display column
 * varies by table. Picks the first present, non-empty string field from a
 * priority list; falls back to the id so a row is never unlabelled.
 */
export function trashRowLabel(row: Record<string, unknown>): string {
  const candidates = [
    "name",
    "title",
    "label",
    "subject",
    "number",
    "invoice_number",
    "po_number",
    "code",
    "identifier",
    "slug",
    "email",
  ];
  for (const key of candidates) {
    const v = row[key];
    if (typeof v === "string" && v.trim().length > 0) return v;
  }
  return typeof row.id === "string" ? row.id : "—";
}
