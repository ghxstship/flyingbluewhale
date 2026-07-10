/**
 * Doc type → pickable record source. Powers the record picker on the
 * per-document preview page: for each record-bindable doc type this names
 * the org-scoped table the resolver binds (see
 * `src/lib/documents/resolvers.ts`) plus how to label a row in the picker.
 *
 * Doc types whose resolver keys off something that has no natural
 * short-list label here (schedule baselines, per-user transcripts,
 * per-assignment tickets/itineraries, offer letters) simply have no entry —
 * the picker hides and `?recordId=` still works for them.
 */

type AnyRow = Record<string, unknown>;

export type DocRecordSource = {
  /** The org-scoped table the doc type binds. */
  table: string;
  /** Columns to select for labeling (id is always included). */
  columns: string[];
  /** Row → human label for the picker option. */
  label: (r: AnyRow) => string;
  /** Order-by column, newest first. Defaults to created_at. */
  orderBy?: string;
};

const s = (v: unknown): string => (v == null ? "" : String(v));
const join = (...parts: unknown[]) => parts.map(s).filter(Boolean).join(" · ");

export const DOC_RECORD_SOURCES: Record<string, DocRecordSource> = {
  proposal: {
    table: "proposals",
    columns: ["title", "doc_number"],
    label: (r) => join(r.doc_number, r.title) || s(r.id),
  },
  invoice: { table: "invoices", columns: ["number"], label: (r) => s(r.number) || s(r.id) },
  receipt: { table: "invoices", columns: ["number"], label: (r) => s(r.number) || s(r.id) },
  quote: { table: "estimates", columns: ["name"], label: (r) => s(r.name) || s(r.id) },
  purchaseorder: { table: "purchase_orders", columns: ["number"], label: (r) => s(r.number) || s(r.id) },
  budget: { table: "projects", columns: ["name"], label: (r) => s(r.name) || s(r.id) },
  pullsheet: { table: "projects", columns: ["name"], label: (r) => s(r.name) || s(r.id) },
  staffing: { table: "projects", columns: ["name"], label: (r) => s(r.name) || s(r.id) },
  callsheet: {
    table: "call_sheets",
    columns: ["title", "event_date"],
    label: (r) => join(r.title, r.event_date) || s(r.id),
  },
  timesheet: {
    table: "timesheets",
    columns: ["period_start", "period_end"],
    label: (r) => join(r.period_start, r.period_end) || s(r.id),
  },
  incident: {
    table: "incidents",
    columns: ["summary", "occurred_at"],
    label: (r) => s(r.summary).slice(0, 80) || s(r.id),
  },
  inspection: { table: "inspections", columns: ["code", "name"], label: (r) => join(r.code, r.name) || s(r.id) },
  guestlist: { table: "guest_lists", columns: ["name"], label: (r) => s(r.name) || s(r.id) },
  certificate: {
    table: "credentials",
    columns: ["kind", "number"],
    label: (r) => join(r.kind, r.number) || s(r.id),
  },
  syllabus: { table: "courses", columns: ["title"], label: (r) => s(r.title) || s(r.id) },
  agreement: {
    table: "contracts",
    columns: ["number", "counterparty_name"],
    label: (r) => join(r.number, r.counterparty_name) || s(r.id),
  },
  vendoragreement: {
    table: "contracts",
    columns: ["number", "counterparty_name"],
    label: (r) => join(r.number, r.counterparty_name) || s(r.id),
  },
  roster: { table: "rosters", columns: ["name"], label: (r) => s(r.name) || s(r.id) },
  changeorder: {
    table: "change_orders",
    columns: ["number", "summary"],
    label: (r) => join(r.number, s(r.summary).slice(0, 60)) || s(r.id),
  },
  recap: {
    table: "show_recaps",
    columns: ["event_name", "event_date"],
    label: (r) => join(r.event_name, r.event_date) || s(r.id),
  },
  runofshow: { table: "run_of_shows", columns: ["name"], label: (r) => s(r.name) || s(r.id) },
  rams: { table: "rams_assessments", columns: ["title", "rev"], label: (r) => join(r.title, r.rev) || s(r.id) },
  sop: { table: "sops", columns: ["code", "title"], label: (r) => join(r.code, r.title) || s(r.id) },
  erp: {
    table: "emergency_response_plans",
    columns: ["event_name", "rev"],
    label: (r) => join(r.event_name, r.rev) || s(r.id),
  },
};

export function getDocRecordSource(docType: string): DocRecordSource | undefined {
  return DOC_RECORD_SOURCES[docType];
}
