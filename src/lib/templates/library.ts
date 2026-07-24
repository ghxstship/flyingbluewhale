/**
 * Unified template library (L-P2) — server-side builders for the merged
 * family index the LEG3ND library (/legend/hub/templates) renders:
 *
 *   doc          — the 29-type code-defined document registry (DOC_TEMPLATES)
 *   job          — job_templates (hub-native scope checklists)
 *   field        — field_templates (COMPVSS kit-31 field library)
 *   advance      — org_advance_presets (the advance-packet preset matrix)
 *   guide        — org_guide_templates (Boarding Pass guide configs)
 *   proposal     — proposal_templates (system + org block/theme catalogs)
 *   project      — project_templates (project blueprints)
 *   inspection   — inspection_templates (inspection shapes)
 *   email        — email_templates (org overrides of the kit comm defaults)
 *   deliverable  — deliverable_templates (advancing doc-spec seeds)
 *   notification — notification_templates (system notification copy)
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
  type TemplateVersionEntry,
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
  blockCount: null,
  system: false,
  state: null,
  version: null,
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

export type GuideTemplateRow = {
  id: string;
  name: string;
  persona: string;
  description: string | null;
  templateState: string;
};

/** Guide family — org_guide_templates. Managed inline in the library. */
export function buildGuideItems(rows: readonly GuideTemplateRow[]): TemplateLibraryItem[] {
  return rows.map((r) => ({
    ...BASE,
    family: "guide" as const,
    id: r.id,
    title: r.name,
    subtitle: r.description ?? r.persona,
    // Managed inline in the library (publish/archive); seeded from
    // /studio/projects/[projectId]/guides. No separate editor surface.
    href: "",
    state: r.templateState,
    searchText: haystack(r.name, r.persona, r.description, "guide boarding pass"),
  }));
}

export type ProposalTemplateRow = {
  id: string;
  name: string;
  scope: string;
  isSystem: boolean;
  blockCount: number;
};

export function buildProposalItems(rows: readonly ProposalTemplateRow[]): TemplateLibraryItem[] {
  return rows.map((r) => ({
    ...BASE,
    family: "proposal" as const,
    id: r.id,
    title: r.name,
    subtitle: r.scope,
    href: urlFor("platform", `/proposals/templates/${r.id}`),
    system: r.isSystem,
    blockCount: r.blockCount,
    searchText: haystack(r.name, r.scope, "proposal"),
  }));
}

export type ProjectTemplateRow = {
  id: string;
  name: string;
  category: string;
  tagline: string | null;
  isOfficial: boolean;
  enabled: boolean;
};

export function buildProjectItems(rows: readonly ProjectTemplateRow[]): TemplateLibraryItem[] {
  return rows.map((r) => ({
    ...BASE,
    family: "project" as const,
    id: r.id,
    title: r.name,
    subtitle: r.tagline ?? r.category,
    href: urlFor("platform", `/templates/${r.id}`),
    system: r.isOfficial,
    enabled: r.enabled,
    searchText: haystack(r.name, r.category, r.tagline, "project blueprint"),
  }));
}

export type InspectionTemplateRow = {
  id: string;
  name: string;
  category: string;
  itemCount: number;
};

export function buildInspectionItems(rows: readonly InspectionTemplateRow[]): TemplateLibraryItem[] {
  return rows.map((r) => ({
    ...BASE,
    family: "inspection" as const,
    id: r.id,
    title: r.name,
    subtitle: r.category,
    href: urlFor("platform", "/inspections/templates"),
    stepCount: r.itemCount,
    searchText: haystack(r.name, r.category, "inspection"),
  }));
}

export type EmailTemplateRow = {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
};

export function buildEmailItems(rows: readonly EmailTemplateRow[]): TemplateLibraryItem[] {
  return rows.map((r) => ({
    ...BASE,
    family: "email" as const,
    id: r.id,
    title: r.name,
    subtitle: r.slug,
    href: urlFor("platform", "/settings/email-templates"),
    enabled: r.isActive,
    searchText: haystack(r.name, r.slug, "email"),
  }));
}

export type DeliverableTemplateRow = {
  id: string;
  name: string;
  type: string;
  isGlobal: boolean;
};

export function buildDeliverableItems(rows: readonly DeliverableTemplateRow[]): TemplateLibraryItem[] {
  return rows.map((r) => ({
    ...BASE,
    family: "deliverable" as const,
    id: r.id,
    title: r.name,
    subtitle: r.type,
    href: urlFor("platform", "/settings/deliverable-templates"),
    system: r.isGlobal,
    searchText: haystack(r.name, r.type, "deliverable doc spec"),
  }));
}

export type NotificationTemplateRow = {
  id: string;
  templateKey: string;
  channel: string;
  version: number;
  state: string;
  isPlatform: boolean;
};

export function buildNotificationItems(
  rows: readonly NotificationTemplateRow[],
): TemplateLibraryItem[] {
  return rows.map((r) => ({
    ...BASE,
    family: "notification" as const,
    id: r.id,
    title: r.templateKey,
    subtitle: r.channel,
    href: urlFor("platform", "/settings/notification-templates"),
    system: r.isPlatform,
    state: r.state,
    version: r.version,
    searchText: haystack(r.templateKey, r.channel, "notification"),
  }));
}

/**
 * Cross-family creation routes for the "New template" affordance. `null`
 * means the family's templates are registry-fixed (doc), platform-seeded
 * (notification), or captured from a live record instead of authored blank
 * (guide: "Save as org template" on a project guide; proposal/project:
 * seeded system rows + org rows captured from records; deliverable: seeded
 * per-project) — the affordance explains that honestly instead of offering
 * a dead-end form.
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
    case "guide":
      return null;
    case "proposal":
      return null;
    case "project":
      return null;
    case "inspection":
      return urlFor("platform", "/inspections/templates/new");
    case "email":
      return urlFor("platform", "/settings/email-templates");
    case "deliverable":
      return urlFor("platform", "/settings/deliverable-templates");
    case "notification":
      return null;
  }
}

/** Families whose "New template" is a real authoring route (vs null above). */
export const AUTHORED_FAMILIES: readonly TemplateFamily[] = [
  "job",
  "field",
  "advance",
  "inspection",
  "email",
  "deliverable",
] as const;
