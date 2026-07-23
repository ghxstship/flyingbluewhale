/**
 * Unified template library (L-P2) — server-side builders for the merged
 * four-family index the LEG3ND library (/legend/hub/templates) renders:
 *
 *   doc     — the 29-type code-defined document registry (DOC_TEMPLATES)
 *   job     — job_templates (hub-native scope checklists)
 *   field   — field_templates (COMPVSS kit-31 field library)
 *   advance — org_advance_presets (the advance-packet preset matrix)
 *
 * Family vocabulary + the ratcheted store map live in ./library-shared.ts
 * (client-safe). This module is server-only by inclusion (the doc resolvers
 * import `server-only`); the page serializes `TemplateLibraryItem`s into the
 * client island.
 */
import { DOC_TEMPLATES } from "@/lib/documents/registry";
import { paths } from "@/lib/documents/contract";
import { supportsRecordBinding } from "@/lib/documents/resolvers";
import {
  docDefaultBrand,
  isDocTypeOffered,
  type DocSettingsMap,
} from "@/lib/documents/org-settings";
import { urlFor } from "@/lib/urls";
import type { TemplateFamily, TemplateLibraryItem } from "./library-shared";

export {
  TEMPLATE_FAMILIES,
  TEMPLATE_STORES,
  storesForFamily,
  type TemplateFamily,
  type TemplateLibraryItem,
} from "./library-shared";

function haystack(...parts: Array<string | null | undefined>): string {
  return parts.filter(Boolean).join(" ").toLowerCase();
}

const BASE: Omit<TemplateLibraryItem, "family" | "id" | "title" | "href" | "searchText"> = {
  subtitle: null,
  app: null,
  mergeFieldCount: null,
  recordBacked: false,
  enabled: true,
  defaultBrand: null,
  stepCount: null,
  useCount: null,
  sectionCount: null,
};

/** Doc family — every registry template, annotated per the org's settings. */
export function buildDocItems(settings: DocSettingsMap): TemplateLibraryItem[] {
  return DOC_TEMPLATES.map((tpl) => ({
    ...BASE,
    family: "doc" as const,
    id: tpl.id,
    title: tpl.title,
    subtitle: tpl.schema,
    href: urlFor("platform", `/documents/${tpl.id}`),
    app: tpl.app,
    mergeFieldCount: paths(tpl).length,
    recordBacked: supportsRecordBinding(tpl.id),
    enabled: isDocTypeOffered(tpl.id, settings),
    defaultBrand: docDefaultBrand(tpl.id, settings),
    searchText: haystack(tpl.title, tpl.id, tpl.schema, tpl.app, "document"),
  }));
}

export type JobTemplateRow = {
  id: string;
  name: string;
  trade: string | null;
  stepCount: number;
};

export function buildJobItems(rows: readonly JobTemplateRow[]): TemplateLibraryItem[] {
  return rows.map((r) => ({
    ...BASE,
    family: "job" as const,
    id: r.id,
    title: r.name,
    subtitle: r.trade,
    href: "/legend/hub/templates/job-templates",
    stepCount: r.stepCount,
    searchText: haystack(r.name, r.trade, "job"),
  }));
}

export type FieldTemplateRow = {
  id: string;
  name: string;
  category: string;
  summary: string | null;
  useCount: number;
};

export function buildFieldItems(rows: readonly FieldTemplateRow[]): TemplateLibraryItem[] {
  return rows.map((r) => ({
    ...BASE,
    family: "field" as const,
    id: r.id,
    title: r.name,
    subtitle: r.summary ?? r.category,
    href: urlFor("mobile", "/templates"),
    useCount: r.useCount,
    searchText: haystack(r.name, r.category, r.summary, "field"),
  }));
}

export type AdvancePresetGroup = {
  audienceType: string;
  sectionCount: number;
};

export function buildAdvanceItems(groups: readonly AdvancePresetGroup[]): TemplateLibraryItem[] {
  return groups.map((g) => ({
    ...BASE,
    family: "advance" as const,
    id: g.audienceType,
    title: g.audienceType.replace(/_/g, " "),
    subtitle: null,
    href: urlFor("platform", "/settings/advancing"),
    sectionCount: g.sectionCount,
    searchText: haystack(g.audienceType, "advance preset"),
  }));
}

/**
 * Cross-family creation routes for the "New template" affordance. `null`
 * means the family's templates are registry-fixed (code-defined) — the
 * affordance explains that honestly instead of offering a dead-end form.
 */
export function familyCreateHref(family: TemplateFamily): string | null {
  switch (family) {
    case "doc":
      return null;
    case "job":
      return "/legend/hub/templates/job-templates/new";
    case "field":
      return urlFor("mobile", "/templates");
    case "advance":
      return urlFor("platform", "/settings/advancing");
  }
}
