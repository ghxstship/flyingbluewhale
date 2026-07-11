/**
 * Advance submission schema registry (kit 27, plan §02).
 *
 * Structured returns replace the copy-a-Sheet + form workflow from the
 * source campaigns: columns are lifted column-for-column from the real
 * Factory Town worksheets (Crew List, Production Advance) and the EDCLV26
 * per-department travel advance spreadsheets. Every category — travel
 * included (decision #4) — is assignable per audience via the section
 * matrix; the schema key on a packet section selects the grid a recipient
 * fills in the portal.
 *
 * Pure module (no server-only): consumed by portal forms, the studio
 * tracking board, exports, and tests.
 */

export type SubmissionColumnKind = "text" | "date" | "number" | "select";

export type SubmissionColumn = {
  key: string;
  label: string;
  kind: SubmissionColumnKind;
  required?: boolean;
  options?: readonly string[];
};

export type SubmissionSchema = {
  key: string;
  label: string;
  description: string;
  columns: readonly SubmissionColumn[];
};

export const SUBMISSION_SCHEMAS = {
  crew_list: {
    key: "crew_list",
    label: "Crew List",
    description: "One row per crew member advancing on site: identity, credential, and scope of days.",
    columns: [
      { key: "name", label: "Full Name", kind: "text", required: true },
      { key: "role", label: "Role", kind: "text", required: true },
      { key: "email", label: "Email", kind: "text", required: true },
      { key: "phone", label: "Phone", kind: "text" },
      { key: "scope", label: "Scope", kind: "select", options: ["load_in", "show_days", "load_out", "all_days"] },
      { key: "credential_type", label: "Credential", kind: "text" },
      { key: "catering", label: "Catering", kind: "select", options: ["none", "standard", "vegetarian", "vegan"] },
      { key: "notes", label: "Notes", kind: "text" },
    ],
  },
  production_advance: {
    key: "production_advance",
    label: "Production Advance",
    description: "Per-request production needs: power, rigging, parking, wifi, radios, and gear on site.",
    columns: [
      { key: "category", label: "Category", kind: "select", options: ["power", "rigging", "parking", "wifi", "radios", "equipment", "other"], required: true },
      { key: "item", label: "Item", kind: "text", required: true },
      { key: "qty", label: "Qty", kind: "number" },
      { key: "needed_by", label: "Needed By", kind: "date" },
      { key: "notes", label: "Notes", kind: "text" },
    ],
  },
  travel: {
    key: "travel",
    label: "Travel",
    description: "Per-person travel rows: in/out dates, origin, hotel nights, ground transport, agency reference.",
    columns: [
      { key: "name", label: "Full Name", kind: "text", required: true },
      { key: "role", label: "Role", kind: "text" },
      { key: "arrival_date", label: "In Date", kind: "date", required: true },
      { key: "departure_date", label: "Out Date", kind: "date", required: true },
      { key: "origin", label: "Origin", kind: "text" },
      { key: "hotel_nights", label: "Hotel Nights", kind: "number" },
      { key: "ground_transport", label: "Ground Transport", kind: "select", options: ["none", "rental", "shuttle", "rideshare"] },
      { key: "agency_ref", label: "Agency Ref", kind: "text" },
    ],
  },
  rider_upload: {
    key: "rider_upload",
    label: "Rider Upload",
    description: "Document returns: tech rider, stage plot, input list. Files land as deliverables; rows log the manifest.",
    columns: [
      { key: "label", label: "Document", kind: "text", required: true },
      { key: "file_url", label: "File", kind: "text" },
      { key: "notes", label: "Notes", kind: "text" },
    ],
  },
} as const satisfies Record<string, SubmissionSchema>;

export type SubmissionSchemaKey = keyof typeof SUBMISSION_SCHEMAS;

export const SUBMISSION_SCHEMA_KEYS = Object.keys(SUBMISSION_SCHEMAS) as SubmissionSchemaKey[];

export function getSubmissionSchema(key: string | null | undefined): SubmissionSchema | null {
  if (!key) return null;
  return (SUBMISSION_SCHEMAS as Record<string, SubmissionSchema>)[key] ?? null;
}
