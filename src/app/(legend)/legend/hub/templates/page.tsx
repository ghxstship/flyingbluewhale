import { ModuleHeader } from "@/components/Shell";
import { isManagerPlus, can, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { urlFor } from "@/lib/urls";
import { getRequestT } from "@/lib/i18n/request";
import { getOrgDocSettings } from "@/lib/documents/org-settings";
import {
  buildAdvanceItems,
  buildDeliverableItems,
  buildDocItems,
  buildEmailItems,
  buildFieldItems,
  buildGuideItems,
  buildInspectionItems,
  buildJobItems,
  buildNotificationItems,
  buildProjectItems,
  buildProposalItems,
  familyCreateHref,
  TEMPLATE_FAMILIES,
  type TemplateFamily,
  type TemplateLibraryItem,
  type TemplateVersionEntry,
} from "@/lib/templates/library";
import { TemplateLibrary } from "./TemplateLibrary";

export const dynamic = "force-dynamic";

/**
 * The ONE template library (L-P2, expanded 2026-07-24). Every template family
 * in the product in one surface with real data: the code-defined doc registry
 * (with per-type merge-field meta + the org configurator over
 * org_doc_template_settings), hub-native job templates, COMPVSS field
 * templates, the advance-packet preset matrix, org guide templates (Boarding
 * Pass), proposal/project/inspection/email/deliverable/notification stores.
 * Unified search/filter across families rides the client island; every item
 * deep-links to its native editor/preview where one exists.
 *
 * Configurator enforcement rule: a DISABLED doc type is hidden from creation
 * pickers (here + the /studio/documents hub) but stays renderable for
 * existing records. See src/lib/documents/org-settings.ts.
 */
export default async function TemplatesPillarPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.legend.hub.templates.eyebrow", undefined, "Organization Hub")}
          title={t("console.legend.hub.templates.title", undefined, "Templates")}
        />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const [
    jobRes,
    fieldRes,
    advanceRes,
    docSettings,
    guideRes,
    proposalRes,
    projectRes,
    inspectionRes,
    emailRes,
    deliverableRes,
    notificationRes,
  ] = await Promise.all([
    supabase
      .from("job_templates")
      .select("id, name, trade, steps:job_template_steps(count)")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("field_templates")
      .select("id, name, category, summary, use_count")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(200),
    supabase
      .from("org_advance_presets")
      .select("audience_type")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .limit(500),
    getOrgDocSettings(supabase, session.orgId),
    supabase
      .from("org_guide_templates")
      .select("id, name, persona, description, template_state")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(200),
    // System rows (org_id NULL) + this org's rows — RLS scopes visibility.
    supabase
      .from("proposal_templates")
      .select("id, name, scope, is_system, blocks")
      .is("deleted_at", null)
      .order("is_system", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(200),
    supabase
      .from("project_templates")
      .select("id, name, category, tagline, is_official, enabled")
      .order("is_official", { ascending: false })
      .order("name", { ascending: true })
      .limit(200),
    supabase
      .from("inspection_templates")
      .select("id, name, category, items:inspection_template_items(count)")
      .eq("org_id", session.orgId)
      .order("name", { ascending: true })
      .limit(200),
    supabase
      .from("email_templates")
      .select("id, slug, name, is_active")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("slug", { ascending: true })
      .limit(200),
    supabase
      .from("deliverable_templates")
      .select("id, name, type, is_global")
      .is("deleted_at", null)
      .order("name", { ascending: true })
      .limit(200),
    // Platform defaults (org_id NULL) + org overrides — RLS scopes visibility.
    supabase
      .from("notification_templates")
      .select("id, org_id, template_key, channel, version, template_state")
      .order("template_key", { ascending: true })
      .limit(300),
  ]);

  const jobRows = (jobRes.data ?? []) as unknown as Array<{
    id: string;
    name: string;
    trade: string | null;
    steps: { count: number }[] | null;
  }>;
  const fieldRows = (fieldRes.data ?? []) as unknown as Array<{
    id: string;
    name: string;
    category: string;
    summary: string | null;
    use_count: number;
  }>;
  const presetRows = (advanceRes.data ?? []) as Array<{ audience_type: string }>;
  const guideRows = (guideRes.data ?? []) as unknown as Array<{
    id: string;
    name: string;
    persona: string;
    description: string | null;
    template_state: string;
  }>;
  const proposalRows = (proposalRes.data ?? []) as unknown as Array<{
    id: string;
    name: string;
    scope: string;
    is_system: boolean;
    blocks: unknown;
  }>;
  const projectRows = (projectRes.data ?? []) as unknown as Array<{
    id: string;
    name: string;
    category: string;
    tagline: string | null;
    is_official: boolean;
    enabled: boolean;
  }>;
  const inspectionRows = (inspectionRes.data ?? []) as unknown as Array<{
    id: string;
    name: string;
    category: string;
    items: { count: number }[] | null;
  }>;
  const emailRows = (emailRes.data ?? []) as unknown as Array<{
    id: string;
    slug: string;
    name: string;
    is_active: boolean;
  }>;
  const deliverableRows = (deliverableRes.data ?? []) as unknown as Array<{
    id: string;
    name: string;
    type: string;
    is_global: boolean;
  }>;
  const notificationRows = (notificationRes.data ?? []) as unknown as Array<{
    id: string;
    org_id: string | null;
    template_key: string;
    channel: string;
    version: number;
    template_state: string;
  }>;

  const audienceCounts = new Map<string, number>();
  for (const row of presetRows) {
    audienceCounts.set(row.audience_type, (audienceCounts.get(row.audience_type) ?? 0) + 1);
  }

  // Version history (template_versions journal) — batched: every version row
  // for this org (template edits are low-volume config writes), author names
  // resolved in one users read. Keyed "family:templateId" for the island.
  const { data: versionRows } = await supabase
    .from("template_versions")
    .select("family, template_id, version, created_at, changed_by")
    .eq("org_id", session.orgId)
    .order("version", { ascending: false })
    .limit(1000);
  const changerIds = Array.from(
    new Set((versionRows ?? []).map((v) => v.changed_by).filter((v): v is string => !!v)),
  );
  const changerNames = new Map<string, string>();
  if (changerIds.length > 0) {
    // soft-delete-exempt: resolving display names of historical FKs — a
    // departed author must still label the versions they wrote.
    const { data: users } = await supabase.from("users").select("id, name, email").in("id", changerIds);
    for (const u of users ?? []) changerNames.set(u.id, u.name || u.email);
  }
  const versionsByKey: Record<string, TemplateVersionEntry[]> = {};
  for (const v of versionRows ?? []) {
    const key = `${v.family}:${v.template_id}`;
    (versionsByKey[key] ??= []).push({
      version: v.version,
      createdAt: v.created_at,
      changedBy: v.changed_by ? (changerNames.get(v.changed_by) ?? null) : null,
    });
  }

  const items: TemplateLibraryItem[] = [
    ...buildDocItems(docSettings),
    ...buildJobItems(
      jobRows.map((r) => ({
        id: r.id,
        name: r.name,
        trade: r.trade,
        stepCount: r.steps?.[0]?.count ?? 0,
      })),
    ),
    ...buildFieldItems(
      fieldRows.map((r) => ({
        id: r.id,
        name: r.name,
        category: r.category,
        summary: r.summary,
        useCount: r.use_count,
      })),
    ),
    ...buildAdvanceItems(
      Array.from(audienceCounts.entries()).map(([audienceType, sectionCount]) => ({
        audienceType,
        sectionCount,
      })),
    ),
    ...buildGuideItems(
      guideRows.map((r) => ({
        id: r.id,
        name: r.name,
        persona: r.persona,
        description: r.description,
        templateState: r.template_state,
      })),
    ),
    ...buildProposalItems(
      proposalRows.map((r) => ({
        id: r.id,
        name: r.name,
        scope: r.scope,
        isSystem: r.is_system,
        blockCount: Array.isArray(r.blocks) ? r.blocks.length : 0,
      })),
    ),
    ...buildProjectItems(
      projectRows.map((r) => ({
        id: r.id,
        name: r.name,
        category: r.category,
        tagline: r.tagline,
        isOfficial: r.is_official,
        enabled: r.enabled,
      })),
    ),
    ...buildInspectionItems(
      inspectionRows.map((r) => ({
        id: r.id,
        name: r.name,
        category: r.category,
        itemCount: r.items?.[0]?.count ?? 0,
      })),
    ),
    ...buildEmailItems(
      emailRows.map((r) => ({ id: r.id, slug: r.slug, name: r.name, isActive: r.is_active })),
    ),
    ...buildDeliverableItems(
      deliverableRows.map((r) => ({ id: r.id, name: r.name, type: r.type, isGlobal: r.is_global })),
    ),
    ...buildNotificationItems(
      notificationRows.map((r) => ({
        id: r.id,
        templateKey: r.template_key,
        channel: r.channel,
        version: r.version,
        state: r.template_state,
        isPlatform: r.org_id === null,
      })),
    ),
  ];

  const createHrefs = Object.fromEntries(
    TEMPLATE_FAMILIES.map((f) => [f, familyCreateHref(f)]),
  ) as Record<TemplateFamily, string | null>;
  const homeHrefs: Record<TemplateFamily, string | null> = {
    doc: urlFor("platform", "/documents"),
    job: "/legend/hub/templates/job-templates",
    field: urlFor("mobile", "/templates"),
    advance: urlFor("platform", "/settings/advancing"),
    guide: null,
    proposal: urlFor("platform", "/proposals/templates"),
    project: urlFor("platform", "/templates"),
    inspection: urlFor("platform", "/inspections/templates"),
    email: urlFor("platform", "/settings/email-templates"),
    deliverable: urlFor("platform", "/settings/deliverable-templates"),
    notification: urlFor("platform", "/settings/notification-templates"),
  };

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.hub.templates.eyebrow", undefined, "Organization Hub")}
        title={t("console.legend.hub.templates.title", undefined, "Templates")}
        subtitle={t(
          "console.legend.hub.templates.subtitle",
          undefined,
          "Configure once, reuse on every project. Every template family, one library.",
        )}
        breadcrumbs={[
          { label: t("console.legend.hub.breadcrumb", undefined, "LEG3ND") },
          { label: t("console.legend.hub.title", undefined, "Organization Hub"), href: "/legend/hub" },
          { label: t("console.legend.hub.templates.title", undefined, "Templates") },
        ]}
      />
      <div className="page-content">
        <TemplateLibrary
          items={items}
          canManage={isManagerPlus(session) || can(session, "templates:write")}
          createHrefs={createHrefs}
          homeHrefs={homeHrefs}
          versionsByKey={versionsByKey}
        />
      </div>
    </>
  );
}
