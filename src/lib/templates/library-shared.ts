/**
 * Client-safe half of the unified template library SSOT (L-P2). The server
 * builders live in ./library.ts (they import the doc resolvers, which are
 * `server-only`); this module carries the family vocabulary, the store map,
 * and the serialized item shape so client islands can import them.
 */

export const TEMPLATE_FAMILIES = [
  "doc",
  "job",
  "field",
  "advance",
  "guide",
  "proposal",
  "project",
  "inspection",
  "email",
  "deliverable",
  "notification",
] as const;
export type TemplateFamily = (typeof TEMPLATE_FAMILIES)[number];

/**
 * Every known template-backing store in the schema (plus the code registry),
 * mapped to its library family — or excluded with a documented reason.
 * RATCHET: `library.test.ts` scans supabase/migrations for every
 * `*_templates` / `*_presets` table and asserts each one appears here —
 * either mapped to a family or explicitly excluded. A new template store
 * cannot ship without deciding whether it joins the library.
 */
export const TEMPLATE_STORES: Record<string, { family: TemplateFamily } | { excluded: string }> = {
  "registry:DOC_TEMPLATES": { family: "doc" },
  job_templates: { family: "job" },
  field_templates: { family: "field" },
  org_advance_presets: { family: "advance" },
  org_guide_templates: { family: "guide" },
  proposal_templates: { family: "proposal" },
  project_templates: { family: "project" },
  inspection_templates: { family: "inspection" },
  email_templates: { family: "email" },
  deliverable_templates: { family: "deliverable" },
  notification_templates: { family: "notification" },
  project_advance_presets: {
    excluded:
      "Project-scope override rows of the advance family; the org-level matrix (org_advance_presets) is the library entry.",
  },
};

/** Stores that feed a given family (ratchet: every family has at least one). */
export function storesForFamily(family: TemplateFamily): string[] {
  return Object.entries(TEMPLATE_STORES)
    .filter(([, v]) => "family" in v && v.family === family)
    .map(([k]) => k);
}

/**
 * One row of the merged library index. Display strings stay raw (counts as
 * numbers) so the client island can format them through useT().
 */
export type TemplateLibraryItem = {
  family: TemplateFamily;
  id: string;
  title: string;
  /** Secondary line: doc schema, field summary, job trade, audience type. */
  subtitle: string | null;
  /** Deep link to the item's native editor/preview surface. "" = no surface. */
  href: string;
  /** doc family: owning app (atlvs/compvss/gvteway/legend). */
  app: string | null;
  /** doc family: number of merge-field paths in the template contract. */
  mergeFieldCount: number | null;
  /** doc family: binds live org records. */
  recordBacked: boolean;
  /** doc family: offered per org_doc_template_settings (default true). email: is_active. */
  enabled: boolean;
  /** doc family: org default brand mode, or null. */
  defaultBrand: string | null;
  /** job/inspection family: checklist step / item count. */
  stepCount: number | null;
  /** field family: times applied. */
  useCount: number | null;
  /** advance family: preset section rows for the audience. */
  sectionCount: number | null;
  /** proposal family: block count. */
  blockCount: number | null;
  /** Platform-shipped row (is_system / is_official / org_id NULL). */
  system: boolean;
  /** Lifecycle state where the store has one (guide template_state, notification status). */
  state: string | null;
  /** notification family: integer template version. */
  version: number | null;
  /** Precomputed lowercase haystack for the unified search. */
  searchText: string;
};
