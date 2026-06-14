import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { addVersion, addMember, publishVersion, supersedeVersion } from "./actions";
import { toneFor } from "@/lib/tones";

export const dynamic = "force-dynamic";

type SheetSetState = "draft" | "in_review" | "published" | "superseded" | "archived";
type SitePlanState = "draft" | "in_review" | "approved" | "issued" | "superseded" | "as_built";

type SheetSet = {
  id: string;
  name: string;
  description: string | null;
  discipline: string | null;
  current_version_id: string | null;
  project_id: string;
  project: { id: string; name: string | null } | null;
};

type Version = {
  id: string;
  version_label: string;
  set_state: SheetSetState;
  published_at: string | null;
  notes_md: string | null;
};

type Member = {
  id: string;
  ordinal: number;
  revision_letter_at_publish: string | null;
  site_plan: {
    id: string;
    code: string;
    title: string;
    revision_letter: string | null;
    sheet_type: string;
    document_state: SitePlanState;
  } | null;
};

const INPUT = "w-full rounded-md border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();
  const { t } = await getRequestT();
  const { id } = await params;

  const { data: setRow } = await supabase
    .from("sheet_sets")
    .select("id, name, description, discipline, current_version_id, project_id, project:project_id(id, name)")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!setRow) notFound();
  const sheetSet = setRow as unknown as SheetSet;

  const { data: versions } = await supabase
    .from("sheet_set_versions")
    .select("id, version_label, set_state, published_at, notes_md")
    .eq("sheet_set_id", id)
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false });
  const versionRows = (versions ?? []) as unknown as Version[];

  const activeVersion = sheetSet.current_version_id
    ? (versionRows.find((v) => v.id === sheetSet.current_version_id) ?? null)
    : (versionRows[0] ?? null);

  let memberRows: Member[] = [];
  if (activeVersion) {
    const { data: members } = await supabase
      .from("sheet_set_members")
      .select(
        "id, ordinal, revision_letter_at_publish, site_plan:site_plan_id(id, code, title, revision_letter, sheet_type, document_state)",
      )
      .eq("sheet_set_version_id", activeVersion.id)
      .eq("org_id", session.orgId)
      .order("ordinal", { ascending: true });
    memberRows = (members ?? []) as unknown as Member[];
  }

  const { data: availablePlans } = await supabase
    .from("site_plans")
    .select("id, code, title, sheet_type, revision_letter")
    .eq("org_id", session.orgId)
    .eq("project_id", sheetSet.project_id)
    .is("deleted_at", null)
    .order("code")
    .limit(500);
  const planChoices = (availablePlans ?? []) as Array<{
    id: string;
    code: string;
    title: string;
    sheet_type: string;
    revision_letter: string | null;
  }>;
  const memberPlanIds = new Set(memberRows.map((m) => m.site_plan?.id).filter((x): x is string => !!x));
  const addablePlans = planChoices.filter((p) => !memberPlanIds.has(p.id));

  return (
    <>
      <ModuleHeader
        eyebrow={t(
          "console.drawings.detail.eyebrow",
          { project: sheetSet.project?.name ?? t("console.drawings.detail.projectFallback", undefined, "Project") },
          `Drawings · ${sheetSet.project?.name ?? "Project"}`,
        )}
        title={sheetSet.name}
        subtitle={
          sheetSet.discipline
            ? t(
                "console.drawings.detail.subtitleWithDiscipline",
                { discipline: sheetSet.discipline.toUpperCase(), count: memberRows.length },
                `${sheetSet.discipline.toUpperCase()} · ${memberRows.length} sheets in active version`,
              )
            : t(
                "console.drawings.detail.subtitle",
                { count: memberRows.length },
                `${memberRows.length} sheets in active version`,
              )
        }
        action={
          <div className="flex items-center gap-2">
            <Button href={`/console/drawings/${sheetSet.id}/edit`} size="sm" variant="secondary">
              {t("console.drawings.detail.edit", undefined, "Edit")}
            </Button>
            <Button href="/console/drawings" size="sm" variant="ghost">
              {t("console.drawings.detail.allSheetSets", undefined, "← All Sheet Sets")}
            </Button>
          </div>
        }
      />
      <div className="page-content space-y-6">
        {sheetSet.description && (
          <div className="surface p-4 text-sm text-[var(--p-text-2)]">{sheetSet.description}</div>
        )}

        {/* ── Versions panel ─────────────────────────────────────────────── */}
        <section className="surface space-y-3 p-4">
          <header className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">{t("console.drawings.detail.versions", undefined, "Versions")}</h2>
            <span className="text-xs text-[var(--p-text-2)]">
              {t("console.drawings.detail.versionsCount", { count: versionRows.length }, `${versionRows.length} total`)}{" "}
              ·{" "}
              {activeVersion
                ? t(
                    "console.drawings.detail.activeVersion",
                    { label: activeVersion.version_label },
                    `active: ${activeVersion.version_label}`,
                  )
                : t("console.drawings.detail.noActiveVersion", undefined, "no active version")}
            </span>
          </header>
          {versionRows.length === 0 ? (
            <EmptyState
              size="compact"
              title={t("console.drawings.detail.noVersionsTitle", undefined, "No Versions Yet")}
              description={t(
                "console.drawings.detail.noVersionsEmpty",
                undefined,
                "Add one below to start collecting sheets.",
              )}
            />
          ) : (
            <ul className="space-y-1.5">
              {versionRows.map((v) => (
                <li key={v.id} className="flex items-center justify-between text-xs">
                  <span className="font-mono">
                    {v.version_label}
                    {sheetSet.current_version_id === v.id && (
                      <span className="ms-2 text-[10px] text-[var(--p-success)] uppercase">
                        {t("console.drawings.detail.active", undefined, "active")}
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-2">
                    <Badge variant={toneFor(v.set_state)}>{toTitle(v.set_state)}</Badge>
                    {v.published_at && (
                      <span className="font-mono text-[10px] text-[var(--p-text-2)]">
                        {fmt.dateParts(v.published_at, { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <form action={addVersion} className="mt-2 grid grid-cols-[1fr_auto] gap-2">
            <input type="hidden" name="sheet_set_id" value={sheetSet.id} />
            <input
              name="version_label"
              required
              placeholder={t(
                "console.drawings.detail.versionLabelPlaceholder",
                undefined,
                "Rev 1, 100% CD, 2026-06-01…",
              )}
              className={`${INPUT} text-xs`}
            />
            <Button type="submit" size="sm" variant="secondary">
              {t("console.drawings.detail.addVersion", undefined, "+ Add Version")}
            </Button>
          </form>
          {activeVersion && activeVersion.set_state !== "published" && (
            <form action={publishVersion}>
              <input type="hidden" name="version_id" value={activeVersion.id} />
              <Button type="submit" size="sm">
                {t(
                  "console.drawings.detail.publishVersion",
                  { label: activeVersion.version_label },
                  `Publish ${activeVersion.version_label}`,
                )}
              </Button>
            </form>
          )}
          {activeVersion && activeVersion.set_state === "published" && (
            <form action={supersedeVersion}>
              <input type="hidden" name="version_id" value={activeVersion.id} />
              <Button type="submit" size="sm" variant="ghost">
                {t("console.drawings.detail.markSuperseded", undefined, "Mark Superseded")}
              </Button>
            </form>
          )}
        </section>

        {/* ── Sheets in active version ───────────────────────────────────── */}
        <section className="space-y-3">
          <header className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              {t(
                "console.drawings.detail.sheetsIn",
                {
                  label: activeVersion
                    ? activeVersion.version_label
                    : t("console.drawings.detail.noActiveVersionParen", undefined, "(no active version)"),
                },
                `Sheets in ${activeVersion ? activeVersion.version_label : "(no active version)"}`,
              )}
            </h2>
            <span className="text-xs text-[var(--p-text-2)]">
              {t(
                "console.drawings.detail.sheetsCount",
                { count: memberRows.length, total: planChoices.length },
                `${memberRows.length} of ${planChoices.length} project sheets`,
              )}
            </span>
          </header>
          <DataTable<Member>
            rows={memberRows}
            rowHref={(m) => (m.site_plan ? `/console/site-plans/${m.site_plan.id}` : "#")}
            emptyLabel={t("console.drawings.detail.emptyLabel", undefined, "No sheets in this version yet")}
            emptyDescription={t(
              "console.drawings.detail.emptyDescription",
              undefined,
              "Add sheets from the project's site_plans below to assemble the published set.",
            )}
            columns={[
              {
                key: "ordinal",
                header: "#",
                render: (m) => m.ordinal.toString(),
                accessor: (m) => m.ordinal,
                className: "font-mono text-xs text-right w-12",
              },
              {
                key: "code",
                header: t("console.drawings.detail.columnCode", undefined, "Code"),
                render: (m) => m.site_plan?.code ?? "—",
                accessor: (m) => m.site_plan?.code ?? null,
                className: "font-mono text-xs",
              },
              {
                key: "title",
                header: t("console.drawings.detail.columnTitle", undefined, "Title"),
                render: (m) => m.site_plan?.title ?? "—",
                accessor: (m) => m.site_plan?.title ?? null,
              },
              {
                key: "type",
                header: t("console.drawings.detail.columnType", undefined, "Type"),
                render: (m) => m.site_plan?.sheet_type ?? "—",
                accessor: (m) => m.site_plan?.sheet_type ?? null,
                filterable: true,
                groupable: true,
                className: "text-xs",
              },
              {
                key: "rev",
                header: t("console.drawings.detail.columnRev", undefined, "Rev — At Publish"),
                render: (m) => m.revision_letter_at_publish ?? m.site_plan?.revision_letter ?? "—",
                accessor: (m) => m.revision_letter_at_publish ?? m.site_plan?.revision_letter ?? null,
                className: "font-mono text-xs",
              },
              {
                key: "doc_state",
                header: t("console.drawings.detail.columnDocState", undefined, "Doc State"),
                render: (m) =>
                  m.site_plan ? <Badge variant="muted">{toTitle(m.site_plan.document_state)}</Badge> : "—",
                accessor: (m) => m.site_plan?.document_state ?? null,
              },
            ]}
          />
        </section>

        {/* ── Add sheet to active version ────────────────────────────────── */}
        {activeVersion && activeVersion.set_state !== "published" && addablePlans.length > 0 && (
          <section className="surface space-y-3 p-4">
            <h2 className="text-sm font-semibold">
              {t(
                "console.drawings.detail.addSheetTo",
                { label: activeVersion.version_label },
                `Add sheet to ${activeVersion.version_label}`,
              )}
            </h2>
            <form action={addMember} className="grid grid-cols-[1fr_auto] gap-2">
              <input type="hidden" name="version_id" value={activeVersion.id} />
              <select name="site_plan_id" required className={`${INPUT} text-xs`}>
                <option value="">{t("console.drawings.detail.selectSheet", undefined, "Select a sheet…")}</option>
                {addablePlans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} · {p.title}
                    {p.revision_letter
                      ? t(
                          "console.drawings.detail.revSuffix",
                          { letter: p.revision_letter },
                          ` (Rev ${p.revision_letter})`,
                        )
                      : ""}
                  </option>
                ))}
              </select>
              <Button type="submit" size="sm" variant="secondary">
                {t("console.drawings.detail.addSheet", undefined, "+ Add Sheet")}
              </Button>
            </form>
            <p className="text-[10px] text-[var(--p-text-2)]">
              {t(
                "console.drawings.detail.revisionImmutableNote",
                undefined,
                "The sheet's revision letter is captured at add-time. Once the version publishes, the membership row is immutable.",
              )}
            </p>
          </section>
        )}
      </div>
    </>
  );
}
