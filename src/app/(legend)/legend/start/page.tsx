import Link from "next/link";
import type { Metadata } from "next";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { requireSession, isAdmin, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { urlFor } from "@/lib/urls";
import { DOC_TEMPLATES } from "@/lib/documents/registry";
import { CATALOG_KINDS, CATALOG_KIND_LABEL } from "@/lib/db/catalog-kinds";
import { PLATFORM_ROLES } from "@/lib/supabase/types";
import {
  addCatalogItemAction,
  addCostCenterAction,
  addLocationAction,
  addPositionAction,
  createStartOrgAction,
  installBaseKitAction,
  renameCostCenterAction,
  renamePositionAction,
  sendInviteAction,
} from "./actions";
import { BASE_KIT_COST_CENTERS, BASE_KIT_POSITIONS } from "./base-kit";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return { title: t("console.legend.start.metadata.title", undefined, "Start") };
}

/**
 * LEG3ND /start: the 8-step organization setup sequence (marketing rebuild
 * plan section 10). Organizations are born in LEG3ND on web.
 *
 * There is NO stored wizard state: every step's completion derives from data
 * presence, and each step writes the same tables the Organization Hub
 * manages. Steps are completed in order but can be revisited at any time.
 */
export default async function StartPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.legend.start.eyebrow", undefined, "LEG3ND")}
          title={t("console.legend.start.title", undefined, "Start")}
        />
        <ConfigureSupabase />
      </>
    );
  }

  const session = await requireSession();
  // "Guest" persona = the auto-added demo membership is the user's only org.
  const hasOrg = session.persona !== "guest";
  const admin = isAdmin(session);
  const manager = isManagerPlus(session);

  const supabase = await createClient();

  const [
    { data: org },
    { data: costCenters },
    { data: positions },
    { data: locations, count: locationCount },
    { count: catalogCount },
    { data: invites, count: inviteCount },
    { data: departments },
  ] = hasOrg
    ? await Promise.all([
        supabase.from("orgs").select("name, name_override, slug, logo_url").eq("id", session.orgId).maybeSingle(),
        supabase
          .from("cost_centers")
          .select("id, code, name, active")
          .eq("org_id", session.orgId)
          .order("code", { ascending: true }),
        supabase
          .from("positions")
          .select("id, title, department_code, active")
          .eq("org_id", session.orgId)
          .order("title", { ascending: true })
          .limit(100),
        supabase
          .from("locations")
          .select("id, name, city, country", { count: "exact" })
          .eq("org_id", session.orgId)
          .order("name", { ascending: true })
          .limit(8),
        supabase
          .from("master_catalog_items")
          .select("id", { count: "exact", head: true })
          .eq("org_id", session.orgId)
          .is("deleted_at", null),
        supabase
          .from("invites")
          .select("id, email, role, invite_state", { count: "exact" })
          .eq("org_id", session.orgId)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase.from("dim_department").select("code, label").order("code", { ascending: true }),
      ])
    : [
        { data: null },
        { data: [] },
        { data: [] },
        { data: [], count: 0 },
        { count: 0 },
        { data: [], count: 0 },
        { data: [] },
      ];

  const ccList = costCenters ?? [];
  const posList = positions ?? [];
  const locList = locations ?? [];
  const inviteList = invites ?? [];
  const deptList = departments ?? [];

  const orgName = org?.name_override ?? org?.name ?? "";

  const steps: { id: string; title: string; done: boolean; soft?: boolean }[] = [
    { id: "step-1", title: t("console.legend.start.steps.identity", undefined, "Identity"), done: hasOrg },
    { id: "step-2", title: t("console.legend.start.steps.baseKit", undefined, "Base kit"), done: hasOrg && ccList.length > 0 },
    { id: "step-3", title: t("console.legend.start.steps.organization", undefined, "Organization"), done: hasOrg && posList.length > 0 },
    { id: "step-4", title: t("console.legend.start.steps.financeCodes", undefined, "Finance codes"), done: hasOrg && ccList.length > 0 },
    { id: "step-5", title: t("console.legend.start.steps.locations", undefined, "Locations"), done: hasOrg && (locationCount ?? 0) > 0 },
    { id: "step-6", title: t("console.legend.start.steps.catalogs", undefined, "Catalogs"), done: hasOrg && (catalogCount ?? 0) > 0 },
    { id: "step-7", title: t("console.legend.start.steps.templates", undefined, "Templates"), done: false, soft: true },
    { id: "step-8", title: t("console.legend.start.steps.crewInvites", undefined, "Crew invites"), done: hasOrg && (inviteCount ?? 0) > 0 },
  ];
  const requiredSteps = steps.filter((s) => !s.soft);
  const doneCount = requiredSteps.filter((s) => s.done).length;

  const lockedNote = (
    <p className="text-sm text-[var(--p-text-2)]">
      {t("console.legend.start.lockedNote", undefined, "Create your organization in step 1 to unlock this step.")}
    </p>
  );

  const compvssUrl = urlFor("mobile", "/");

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.start.eyebrow", undefined, "LEG3ND")}
        title={t("console.legend.start.title", undefined, "Start")}
        subtitle={t(
          "console.legend.start.subtitle",
          undefined,
          "Configure your organization once. Every project inherits it.",
        )}
        breadcrumbs={[
          { label: t("console.legend.start.eyebrow", undefined, "LEG3ND") },
          { label: t("console.legend.start.title", undefined, "Start") },
        ]}
      />
      <div className="page-content space-y-6">
        <nav aria-label={t("console.legend.start.progressAria", undefined, "Setup progress")} className="surface p-4">
          <p className="ps-id mb-3 text-xs text-[var(--p-text-2)]">
            {t(
              "console.legend.start.progress",
              { done: doneCount, total: requiredSteps.length },
              `${doneCount} of ${requiredSteps.length} steps complete. Progress reads from your live data, so steps can be revisited at any time.`,
            )}
          </p>
          <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="focus-ring flex items-center justify-between gap-2 rounded-[var(--p-r-md)] border border-[var(--p-border)] px-3 py-2 text-sm hover:bg-[var(--p-surface-2)]"
                >
                  <span className="truncate">
                    <span className="ps-id mr-2 text-xs text-[var(--p-text-2)]">{i + 1}</span>
                    {s.title}
                  </span>
                  <span
                    className={
                      s.done
                        ? "ps-badge ps-badge--ok shrink-0"
                        : s.soft
                          ? "ps-badge ps-badge--neutral shrink-0"
                          : "ps-badge ps-badge--neutral shrink-0"
                    }
                  >
                    {s.done
                      ? t("console.legend.start.stepDone", undefined, "Done")
                      : s.soft
                        ? t("console.legend.start.stepReview", undefined, "Review")
                        : t("console.legend.start.stepTodo", undefined, "To do")}
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Step 1 · Identity */}
        <section id="step-1" aria-labelledby="step-1-h" className="surface space-y-4 p-6">
          <div>
            <h2 id="step-1-h">{t("console.legend.start.step1.heading", undefined, "1. Identity")}</h2>
            <p className="mt-1 text-sm text-[var(--p-text-2)]">
              {t(
                "console.legend.start.step1.blurb",
                undefined,
                "Name the organization your productions live in. You become the owner.",
              )}
            </p>
          </div>
          {hasOrg ? (
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">{orgName}</span>
                {org?.slug ? <span className="ps-id ml-2 text-xs text-[var(--p-text-2)]">{org.slug}</span> : null}
              </p>
              <p className="text-sm text-[var(--p-text-2)]">
                {t("console.legend.start.step1.brandStudioNote", undefined, "Display name and logo live in Brand Studio.")}{" "}
                <a href={urlFor("platform", "/settings/branding")} className="underline">
                  {t("console.legend.start.step1.openBranding", undefined, "Open branding settings")}
                </a>
              </p>
            </div>
          ) : (
            <FormShell
              action={createStartOrgAction}
              submitLabel={t("console.legend.start.step1.submit", undefined, "Create organization")}
              dirtyGuard={false}
              className="space-y-4"
              aria-label={t("console.legend.start.step1.submit", undefined, "Create organization")}
            >
              <Input
                label={t("console.legend.start.step1.orgName", undefined, "Organization name")}
                name="name"
                required
                maxLength={120}
                placeholder={t("console.legend.start.step1.orgNamePlaceholder", undefined, "Acme Productions")}
                autoComplete="organization"
                hint={t("console.legend.start.step1.orgNameHint", undefined, "You can rename this later from Brand Studio.")}
              />
            </FormShell>
          )}
        </section>

        {/* Step 2 · Base kit install */}
        <section id="step-2" aria-labelledby="step-2-h" className="surface space-y-4 p-6">
          <div>
            <h2 id="step-2-h">{t("console.legend.start.step2.heading", undefined, "2. Base kit install")}</h2>
            <p className="mt-1 text-sm text-[var(--p-text-2)]">
              {t(
                "console.legend.start.step2.blurb",
                undefined,
                "Your organization starts with the XPMS 2.5 standard: 10 cost centers and 10 starter positions, one per department class. Everything here is editable after install.",
              )}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="text-sm">{t("console.legend.start.step2.costCenters", undefined, "Cost centers")}</h3>
              <ul className="mt-2 space-y-1 text-sm text-[var(--p-text-2)]">
                {BASE_KIT_COST_CENTERS.map(([code, name]) => (
                  <li key={code}>
                    <span className="ps-id mr-2 text-xs">{code}</span>
                    {name}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm">{t("console.legend.start.step2.starterPositions", undefined, "Starter positions")}</h3>
              <ul className="mt-2 space-y-1 text-sm text-[var(--p-text-2)]">
                {BASE_KIT_POSITIONS.map(([title, dept]) => (
                  <li key={title}>
                    <span className="ps-id mr-2 text-xs">{dept}</span>
                    {title}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {!hasOrg ? (
            lockedNote
          ) : ccList.length > 0 ? (
            <p className="text-sm">
              {t(
                "console.legend.start.step2.installed",
                { costCenters: ccList.length, positions: posList.length },
                `Installed: ${ccList.length} cost centers, ${posList.length} positions. Adjust them in steps 3 and 4.`,
              )}
            </p>
          ) : admin ? (
            <FormShell
              action={installBaseKitAction}
              submitLabel={t("console.legend.start.step2.submit", undefined, "Install base kit")}
              dirtyGuard={false}
              className="space-y-4"
              aria-label={t("console.legend.start.step2.submit", undefined, "Install base kit")}
            >
              <p className="text-sm text-[var(--p-text-2)]">
                {t(
                  "console.legend.start.step2.idempotent",
                  undefined,
                  "The install is idempotent: rows you already have are never duplicated.",
                )}
              </p>
            </FormShell>
          ) : (
            <p className="text-sm text-[var(--p-text-2)]">
              {t("console.legend.start.step2.adminOnly", undefined, "Only an owner or admin can install the base kit.")}
            </p>
          )}
        </section>

        {/* Step 3 · Organization */}
        <section id="step-3" aria-labelledby="step-3-h" className="surface space-y-4 p-6">
          <div>
            <h2 id="step-3-h">{t("console.legend.start.step3.heading", undefined, "3. Organization")}</h2>
            <p className="mt-1 text-sm text-[var(--p-text-2)]">
              {t(
                "console.legend.start.step3.blurb",
                undefined,
                "The position library, classed by XPMS department. The org chart and role assignment read from here. Invite your manager band in",
              )}{" "}
              <a href="#step-8" className="underline">
                {t("console.legend.start.step3.step8Link", undefined, "step 8")}
              </a>
              .
            </p>
          </div>
          {!hasOrg ? (
            lockedNote
          ) : (
            <>
              {posList.length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {posList.map((p) => (
                    <li key={p.id} className="flex items-baseline gap-2">
                      <span className="ps-id text-xs text-[var(--p-text-2)]">{p.department_code ?? "----"}</span>
                      <span>{p.title}</span>
                      {!p.active ? (
                        <span className="ps-badge ps-badge--neutral">
                          {t("console.legend.start.inactive", undefined, "Inactive")}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[var(--p-text-2)]">
                  {t(
                    "console.legend.start.step3.empty",
                    undefined,
                    "Positions land here once the base kit installs in step 2, or add your first one below.",
                  )}
                </p>
              )}
              {manager ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <FormShell
                    action={addPositionAction}
                    submitLabel={t("console.legend.start.step3.addSubmit", undefined, "Add position")}
                    dirtyGuard={false}
                    className="space-y-4 rounded-[var(--p-r-md)] border border-[var(--p-border)] p-4"
                    aria-label={t("console.legend.start.step3.addSubmit", undefined, "Add position")}
                  >
                    <Input
                      label={t("console.legend.start.step3.titleLabel", undefined, "Title")}
                      name="title"
                      required
                      maxLength={120}
                      placeholder={t("console.legend.start.step3.titlePlaceholder", undefined, "Stage Manager")}
                    />
                    <div>
                      <label htmlFor="start-position-dept" className="text-xs font-medium text-[var(--p-text-2)]">
                        {t("console.legend.start.step3.department", undefined, "Department")}
                      </label>
                      <select id="start-position-dept" name="department_code" className="ps-input mt-1.5 w-full" defaultValue="">
                        <option value="">{t("console.legend.start.step3.noDepartment", undefined, "No department")}</option>
                        {deptList.map((d) => (
                          <option key={d.code} value={d.code}>
                            {d.code} {d.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Input
                      label={t("console.legend.start.step3.summaryLabel", undefined, "Summary")}
                      name="summary"
                      maxLength={500}
                      placeholder={t("console.legend.start.step3.summaryPlaceholder", undefined, "Optional one-line scope")}
                    />
                  </FormShell>
                  {posList.length > 0 ? (
                    <FormShell
                      action={renamePositionAction}
                      submitLabel={t("console.legend.start.step3.renameSubmit", undefined, "Rename")}
                      dirtyGuard={false}
                      className="space-y-4 rounded-[var(--p-r-md)] border border-[var(--p-border)] p-4"
                      aria-label={t("console.legend.start.step3.renameAria", undefined, "Rename position")}
                    >
                      <div>
                        <label htmlFor="start-position-rename-id" className="text-xs font-medium text-[var(--p-text-2)]">
                          {t("console.legend.start.step3.position", undefined, "Position")}
                        </label>
                        <select id="start-position-rename-id" name="id" required className="ps-input mt-1.5 w-full">
                          {posList.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Input
                        label={t("console.legend.start.step3.newTitle", undefined, "New title")}
                        name="title"
                        required
                        maxLength={120}
                      />
                    </FormShell>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-[var(--p-text-2)]">
                  {t(
                    "console.legend.start.step3.managerOnly",
                    undefined,
                    "Only manager and above can edit the position library.",
                  )}
                </p>
              )}
            </>
          )}
        </section>

        {/* Step 4 · Finance codes */}
        <section id="step-4" aria-labelledby="step-4-h" className="surface space-y-4 p-6">
          <div>
            <h2 id="step-4-h">{t("console.legend.start.step4.heading", undefined, "4. Finance codes")}</h2>
            <p className="mt-1 text-sm text-[var(--p-text-2)]">
              {t(
                "console.legend.start.step4.blurb",
                undefined,
                "GL codes and cost centers on the XPMS department canon, 0000 through 9000. Rename to match your books or add codes of your own.",
              )}
            </p>
          </div>
          {!hasOrg ? (
            lockedNote
          ) : (
            <>
              {ccList.length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {ccList.map((c) => (
                    <li key={c.id} className="flex items-baseline gap-2">
                      <span className="ps-id text-xs text-[var(--p-text-2)]">{c.code}</span>
                      <span>{c.name}</span>
                      {!c.active ? (
                        <span className="ps-badge ps-badge--neutral">
                          {t("console.legend.start.inactive", undefined, "Inactive")}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[var(--p-text-2)]">
                  {t(
                    "console.legend.start.step4.empty",
                    undefined,
                    "No cost centers yet. Install the base kit in step 2 to seed the 10 XPMS defaults.",
                  )}
                </p>
              )}
              {manager ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {ccList.length > 0 ? (
                    <FormShell
                      action={renameCostCenterAction}
                      submitLabel={t("console.legend.start.step4.renameSubmit", undefined, "Rename")}
                      dirtyGuard={false}
                      className="space-y-4 rounded-[var(--p-r-md)] border border-[var(--p-border)] p-4"
                      aria-label={t("console.legend.start.step4.renameAria", undefined, "Rename cost center")}
                    >
                      <div>
                        <label htmlFor="start-cc-rename-id" className="text-xs font-medium text-[var(--p-text-2)]">
                          {t("console.legend.start.step4.costCenter", undefined, "Cost center")}
                        </label>
                        <select id="start-cc-rename-id" name="id" required className="ps-input mt-1.5 w-full">
                          {ccList.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.code} {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Input
                        label={t("console.legend.start.step4.newName", undefined, "New name")}
                        name="name"
                        required
                        maxLength={120}
                      />
                    </FormShell>
                  ) : null}
                  <FormShell
                    action={addCostCenterAction}
                    submitLabel={t("console.legend.start.step4.addSubmit", undefined, "Add cost center")}
                    dirtyGuard={false}
                    className="space-y-4 rounded-[var(--p-r-md)] border border-[var(--p-border)] p-4"
                    aria-label={t("console.legend.start.step4.addSubmit", undefined, "Add cost center")}
                  >
                    <Input
                      label={t("console.legend.start.step4.code", undefined, "Code")}
                      name="code"
                      required
                      maxLength={4}
                      placeholder="6500"
                      hint={t(
                        "console.legend.start.step4.codeHint",
                        undefined,
                        "Four digits. Sub-codes slot between the department thousands.",
                      )}
                    />
                    <Input
                      label={t("console.legend.start.step4.name", undefined, "Name")}
                      name="name"
                      required
                      maxLength={120}
                      placeholder={t("console.legend.start.step4.namePlaceholder", undefined, "Site Utilities")}
                    />
                  </FormShell>
                </div>
              ) : (
                <p className="text-sm text-[var(--p-text-2)]">
                  {t("console.legend.start.step4.managerOnly", undefined, "Only manager and above can edit finance codes.")}
                </p>
              )}
            </>
          )}
        </section>

        {/* Step 5 · Locations */}
        <section id="step-5" aria-labelledby="step-5-h" className="surface space-y-4 p-6">
          <div>
            <h2 id="step-5-h">{t("console.legend.start.step5.heading", undefined, "5. Locations")}</h2>
            <p className="mt-1 text-sm text-[var(--p-text-2)]">
              {t(
                "console.legend.start.step5.blurb",
                undefined,
                "Your first venue or office. The canonical space registry every schedule and scan zone hangs off.",
              )}
            </p>
          </div>
          {!hasOrg ? (
            lockedNote
          ) : (
            <>
              {locList.length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {locList.map((l) => (
                    <li key={l.id}>
                      {l.name}
                      {l.city ? <span className="text-[var(--p-text-2)]"> · {l.city}</span> : null}
                      {l.country ? <span className="text-[var(--p-text-2)]"> · {l.country}</span> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[var(--p-text-2)]">
                  {t("console.legend.start.step5.empty", undefined, "Your first location lands here.")}
                </p>
              )}
              {manager ? (
                <FormShell
                  action={addLocationAction}
                  submitLabel={t("console.legend.start.step5.submit", undefined, "Add location")}
                  dirtyGuard={false}
                  className="space-y-4 rounded-[var(--p-r-md)] border border-[var(--p-border)] p-4"
                  aria-label={t("console.legend.start.step5.submit", undefined, "Add location")}
                >
                  <Input
                    label={t("console.legend.start.step5.name", undefined, "Name")}
                    name="name"
                    required
                    maxLength={160}
                    placeholder={t("console.legend.start.step5.namePlaceholder", undefined, "Main Warehouse")}
                  />
                  <Input
                    label={t("console.legend.start.step5.address", undefined, "Address")}
                    name="address"
                    maxLength={240}
                    placeholder={t("console.legend.start.step5.addressPlaceholder", undefined, "Optional street address")}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input label={t("console.legend.start.step5.city", undefined, "City")} name="city" maxLength={120} />
                    <Input label={t("console.legend.start.step5.country", undefined, "Country")} name="country" maxLength={120} />
                  </div>
                </FormShell>
              ) : (
                <p className="text-sm text-[var(--p-text-2)]">
                  {t("console.legend.start.step5.managerOnly", undefined, "Only manager and above can add locations.")}
                </p>
              )}
            </>
          )}
        </section>

        {/* Step 6 · Catalogs */}
        <section id="step-6" aria-labelledby="step-6-h" className="surface space-y-4 p-6">
          <div>
            <h2 id="step-6-h">{t("console.legend.start.step6.heading", undefined, "6. Catalogs")}</h2>
            <p className="mt-1 text-sm text-[var(--p-text-2)]">
              {t(
                "console.legend.start.step6.blurb",
                undefined,
                "The master catalog: every assignable thing, from credentials to vehicles. Advancing assignments always reference a catalog SKU.",
              )}
            </p>
          </div>
          {!hasOrg ? (
            lockedNote
          ) : (
            <>
              <p className="text-sm">
                {(catalogCount ?? 0) === 1
                  ? t("console.legend.start.step6.oneItemSoFar", undefined, "1 catalog item so far.")
                  : t(
                      "console.legend.start.step6.nItemsSoFar",
                      { count: catalogCount ?? 0 },
                      `${catalogCount ?? 0} catalog items so far.`,
                    )}{" "}
                <a href={urlFor("platform", "/settings/catalog")} className="underline">
                  {t("console.legend.start.step6.manageLink", undefined, "Manage the full catalog in the console")}
                </a>
              </p>
              {manager ? (
                <FormShell
                  action={addCatalogItemAction}
                  submitLabel={t("console.legend.start.step6.submit", undefined, "Add item")}
                  dirtyGuard={false}
                  className="space-y-4 rounded-[var(--p-r-md)] border border-[var(--p-border)] p-4"
                  aria-label={t("console.legend.start.step6.submitAria", undefined, "Add catalog item")}
                >
                  <div>
                    <label htmlFor="start-catalog-kind" className="text-xs font-medium text-[var(--p-text-2)]">
                      {t("console.legend.start.step6.kind", undefined, "Kind")}
                    </label>
                    <select id="start-catalog-kind" name="kind" required className="ps-input mt-1.5 w-full" defaultValue="credential">
                      {CATALOG_KINDS.map((k) => (
                        <option key={k} value={k}>
                          {CATALOG_KIND_LABEL[k]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label={t("console.legend.start.step6.code", undefined, "Code")}
                    name="code"
                    required
                    maxLength={64}
                    placeholder="crew-pass-tier1"
                    hint={t("console.legend.start.step6.codeHint", undefined, "Short identifier. Lowercase, dashes ok.")}
                  />
                  <Input
                    label={t("console.legend.start.step6.name", undefined, "Name")}
                    name="name"
                    required
                    maxLength={200}
                    placeholder={t("console.legend.start.step6.namePlaceholder", undefined, "Crew Pass (Tier 1)")}
                  />
                </FormShell>
              ) : (
                <p className="text-sm text-[var(--p-text-2)]">
                  {t(
                    "console.legend.start.step6.managerOnly",
                    undefined,
                    "Only manager and above can edit the master catalog.",
                  )}
                </p>
              )}
            </>
          )}
        </section>

        {/* Step 7 · Templates (review step) */}
        <section id="step-7" aria-labelledby="step-7-h" className="surface space-y-4 p-6">
          <div>
            <h2 id="step-7-h">{t("console.legend.start.step7.heading", undefined, "7. Templates")}</h2>
            <p className="mt-1 text-sm text-[var(--p-text-2)]">
              {t(
                "console.legend.start.step7.blurb",
                { count: DOC_TEMPLATES.length },
                `A review step, nothing to install: ${DOC_TEMPLATES.length} document templates ship ready to use, from proposals to run of shows. They pick up your branding automatically.`,
              )}
            </p>
          </div>
          <p className="text-sm">
            <a href={urlFor("platform", "/documents")} className="underline">
              {t("console.legend.start.step7.browseLink", undefined, "Browse the document library in the console")}
            </a>
          </p>
        </section>

        {/* Step 8 · Crew invites */}
        <section id="step-8" aria-labelledby="step-8-h" className="surface space-y-4 p-6">
          <div>
            <h2 id="step-8-h">{t("console.legend.start.step8.heading", undefined, "8. Crew invites")}</h2>
            <p className="mt-1 text-sm text-[var(--p-text-2)]">
              {t(
                "console.legend.start.step8.blurb",
                undefined,
                "Bring in your team. Each invite emails an acceptance link that expires in 7 days.",
              )}
            </p>
          </div>
          {!hasOrg ? (
            lockedNote
          ) : admin ? (
            <>
              {inviteList.length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {inviteList.map((i) => (
                    <li key={i.id} className="flex items-baseline gap-2">
                      <span>{i.email}</span>
                      <span className="ps-id text-xs text-[var(--p-text-2)]">{i.role}</span>
                      <span className="ps-badge ps-badge--neutral">{i.invite_state}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[var(--p-text-2)]">
                  {t("console.legend.start.step8.empty", undefined, "No invites sent yet.")}
                </p>
              )}
              <FormShell
                action={sendInviteAction}
                submitLabel={t("console.legend.start.step8.submit", undefined, "Send invite")}
                dirtyGuard={false}
                className="space-y-4 rounded-[var(--p-r-md)] border border-[var(--p-border)] p-4"
                aria-label={t("console.legend.start.step8.submit", undefined, "Send invite")}
              >
                <Input
                  label={t("console.legend.start.step8.email", undefined, "Email")}
                  name="email"
                  type="email"
                  required
                  placeholder="crew@example.com"
                />
                <div>
                  <label htmlFor="start-invite-role" className="text-xs font-medium text-[var(--p-text-2)]">
                    {t("console.legend.start.step8.role", undefined, "Role")}
                  </label>
                  <select id="start-invite-role" name="role" required className="ps-input mt-1.5 w-full" defaultValue="member">
                    {PLATFORM_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </FormShell>
              <p className="text-sm text-[var(--p-text-2)]">
                {t(
                  "console.legend.start.step8.compvssBefore",
                  undefined,
                  "Crew work from COMPVSS, the field app. Once they accept, they sign in at",
                )}{" "}
                <a href={compvssUrl} className="underline">
                  {compvssUrl}
                </a>{" "}
                {t("console.legend.start.step8.compvssAfter", undefined, "and can install it to their home screen.")}
              </p>
              <p className="text-sm text-[var(--p-text-2)]">
                {t(
                  "console.legend.start.step8.scopingBefore",
                  undefined,
                  "Project scoping, personas, and module-scoped seats live in the",
                )}{" "}
                <a href={urlFor("platform", "/people/invites")} className="underline">
                  {t("console.legend.start.step8.inviteManagerLink", undefined, "console invite manager")}
                </a>
                .
              </p>
            </>
          ) : (
            <p className="text-sm text-[var(--p-text-2)]">
              {t("console.legend.start.step8.adminOnly", undefined, "Only owners and admins can send invites.")}
            </p>
          )}
        </section>

        <div className="surface p-6">
          <h2>{t("console.legend.start.next.heading", undefined, "Where to next")}</h2>
          <p className="mt-1 text-sm text-[var(--p-text-2)]">
            {t("console.legend.start.next.before", undefined, "The")}{" "}
            <Link href="/legend/hub" className="underline">
              {t("console.legend.start.next.hubLink", undefined, "Organization Hub")}
            </Link>{" "}
            {t(
              "console.legend.start.next.after",
              undefined,
              "is the permanent home for everything you just configured. The operator console picks all of it up immediately.",
            )}
          </p>
        </div>
      </div>
    </>
  );
}
