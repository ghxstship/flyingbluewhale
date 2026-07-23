/**
 * Org-level document-template settings (Configurator v1, L-P2).
 *
 * The 29-type registry (src/lib/documents/registry.ts) is code — orgs never
 * fork it. `org_doc_template_settings` holds per-(org, doc_type) OVERRIDES:
 * a type can be disabled for the org, and/or given a default white-label
 * brand mode. Absence of a row means the registry default (enabled, no
 * default brand).
 *
 * ENFORCEMENT RULE (the contract every consumer follows):
 *   - A DISABLED doc type is hidden from creation pickers — the
 *     /studio/documents hub grid and the LEG3ND template library doc section.
 *   - It STAYS renderable for existing records: the
 *     /studio/documents/[docType]?recordId= route and the documents API keep
 *     working, so documents already issued against the type never break.
 *
 * The pure helpers here are shared by pages, actions, and the unit-test
 * ratchet (org-settings.test.ts). The read helper fails OPEN (empty settings
 * → everything offered) so the app keeps working before the migration
 * (20260723170000_org_doc_template_settings) is applied.
 */

export const DOC_BRAND_MODES = ["atlvs", "co", "white"] as const;
export type DocBrandMode = (typeof DOC_BRAND_MODES)[number];

export type OrgDocTemplateSetting = {
  doc_type: string;
  enabled: boolean;
  default_brand: DocBrandMode | null;
  notes: string | null;
};

/** Keyed by registry doc_type id. Absent key = registry default. */
export type DocSettingsMap = ReadonlyMap<string, OrgDocTemplateSetting>;

export const EMPTY_DOC_SETTINGS: DocSettingsMap = new Map();

export function isDocBrandMode(v: unknown): v is DocBrandMode {
  return typeof v === "string" && (DOC_BRAND_MODES as readonly string[]).includes(v);
}

/** Is this doc type offered in creation pickers for the org? Default true. */
export function isDocTypeOffered(docType: string, settings: DocSettingsMap): boolean {
  const row = settings.get(docType);
  return row ? row.enabled : true;
}

/** The org's default brand mode for a doc type, or null (viewer default). */
export function docDefaultBrand(docType: string, settings: DocSettingsMap): DocBrandMode | null {
  return settings.get(docType)?.default_brand ?? null;
}

/**
 * Partition registry templates into what pickers OFFER vs what the org has
 * disabled. Disabled templates are returned (not dropped) so surfaces can
 * annotate honestly — they remain renderable for existing records.
 */
export function partitionDocTemplates<T extends { id: string }>(
  templates: readonly T[],
  settings: DocSettingsMap,
): { offered: T[]; disabled: T[] } {
  const offered: T[] = [];
  const disabled: T[] = [];
  for (const tpl of templates) {
    (isDocTypeOffered(tpl.id, settings) ? offered : disabled).push(tpl);
  }
  return { offered, disabled };
}

/** Coerce raw rows (from Supabase) into the settings map, dropping junk. */
export function toDocSettingsMap(
  rows: ReadonlyArray<{
    doc_type: string;
    enabled: boolean;
    default_brand: string | null;
    notes?: string | null;
  }>,
): DocSettingsMap {
  const map = new Map<string, OrgDocTemplateSetting>();
  for (const r of rows) {
    if (!r.doc_type) continue;
    map.set(r.doc_type, {
      doc_type: r.doc_type,
      enabled: Boolean(r.enabled),
      default_brand: isDocBrandMode(r.default_brand) ? r.default_brand : null,
      notes: r.notes ?? null,
    });
  }
  return map;
}

type SettingsQueryClient = {
  from: (table: "org_doc_template_settings") => {
    select: (cols: string) => {
      eq: (
        col: "org_id",
        v: string,
      ) => PromiseLike<{
        data: Array<{ doc_type: string; enabled: boolean; default_brand: string | null; notes: string | null }> | null;
        error: unknown;
      }>;
    };
  };
};

/**
 * Load the org's doc-template settings. FAILS OPEN: any error (including the
 * table not existing yet — the migration ships as a file first) yields the
 * empty map, i.e. every registry type offered at its default.
 */
export async function getOrgDocSettings(db: unknown, orgId: string): Promise<DocSettingsMap> {
  try {
    const { data, error } = await (db as SettingsQueryClient)
      .from("org_doc_template_settings")
      .select("doc_type, enabled, default_brand, notes")
      .eq("org_id", orgId);
    if (error || !data) return EMPTY_DOC_SETTINGS;
    return toDocSettingsMap(data);
  } catch {
    return EMPTY_DOC_SETTINGS;
  }
}
