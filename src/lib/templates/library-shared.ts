/**
 * Client-safe half of the unified template library SSOT (L-P2). The server
 * builders live in ./library.ts (they import the doc resolvers, which are
 * `server-only`); this module carries the family vocabulary, the store map,
 * and the serialized item shape so client islands can import them.
 */

export const TEMPLATE_FAMILIES = ["doc", "job", "field", "advance"] as const;
export type TemplateFamily = (typeof TEMPLATE_FAMILIES)[number];

/**
 * Every known template-backing store in the schema (plus the code registry),
 * mapped to its library family — or excluded with a documented reason.
 * RATCHET: `library.test.ts` scans supabase/migrations for every
 * `*_templates` / `*_presets` table and asserts each one appears here —
 * either mapped to a family or explicitly excluded. A fifth template store
 * cannot ship without deciding whether it joins the library.
 */
export const TEMPLATE_STORES: Record<string, { family: TemplateFamily } | { excluded: string }> = {
  "registry:DOC_TEMPLATES": { family: "doc" },
  job_templates: { family: "job" },
  field_templates: { family: "field" },
  org_advance_presets: { family: "advance" },
  project_advance_presets: {
    excluded:
      "Project-scope override rows of the advance family; the org-level matrix (org_advance_presets) is the library entry.",
  },
  deliverable_templates: {
    excluded:
      "Advancing doc-spec seeds surfaced inside the per-project advancing workflow, not org-level library config.",
  },
  email_templates: {
    excluded:
      "System comms templates, settings-native at /studio/settings/email-templates. Candidate for a future library family.",
  },
  inspection_templates: {
    excluded:
      "Inspections-native at /studio/inspections/templates. Candidate for a future library family.",
  },
  notification_templates: {
    excluded: "System notification copy store with no org-facing template surface.",
  },
  project_templates: {
    excluded:
      "Project blueprints for project creation, not reusable org work templates. Candidate for a future library family.",
  },
  proposal_templates: {
    excluded:
      "Proposals-native at /studio/proposals/templates. Candidate for a future library family.",
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
  /** Deep link to the item's native editor/preview surface. */
  href: string;
  /** doc family: owning app (atlvs/compvss/gvteway/legend). */
  app: string | null;
  /** doc family: number of merge-field paths in the template contract. */
  mergeFieldCount: number | null;
  /** doc family: binds live org records. */
  recordBacked: boolean;
  /** doc family: offered per org_doc_template_settings (default true). */
  enabled: boolean;
  /** doc family: org default brand mode, or null. */
  defaultBrand: string | null;
  /** job family: checklist step count. */
  stepCount: number | null;
  /** field family: times applied. */
  useCount: number | null;
  /** advance family: preset section rows for the audience. */
  sectionCount: number | null;
  /** Precomputed lowercase haystack for the unified search. */
  searchText: string;
};
