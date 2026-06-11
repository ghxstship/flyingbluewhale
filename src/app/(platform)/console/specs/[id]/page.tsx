import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { issueSection, supersedeSection } from "./actions";
import { toneFor } from "@/lib/tones";

export const dynamic = "force-dynamic";

type SectionState = "draft" | "in_review" | "issued" | "superseded" | "archived";

type Section = {
  id: string;
  section_number: string;
  title: string;
  division: string | null;
  format: string;
  section_state: SectionState;
  body_md: string | null;
  issued_at: string | null;
  created_at: string;
  project_id: string;
  project: { id: string; name: string | null } | null;
};

type LinkedRfi = { id: string; code: string; title: string };
type LinkedSubmittal = { id: string; code: string; title: string };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();
  const { t } = await getRequestT();
  const { id } = await params;

  const { data: row } = await supabase
    .from("spec_sections")
    .select(
      "id, section_number, title, division, format, section_state, body_md, issued_at, created_at, project_id, project:project_id(id, name)",
    )
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!row) notFound();
  const section = row as unknown as Section;

  const [{ data: linkedRfis }, { data: linkedSubmittals }] = await Promise.all([
    supabase
      .from("rfis")
      .select("id, code, title")
      .eq("spec_section_id", id)
      .eq("org_id", session.orgId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("submittals")
      .select("id, code, title")
      .eq("spec_section_id", id)
      .eq("org_id", session.orgId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const rfis = (linkedRfis ?? []) as unknown as LinkedRfi[];
  const submittals = (linkedSubmittals ?? []) as unknown as LinkedSubmittal[];

  return (
    <>
      <ModuleHeader
        eyebrow={`${t("console.specs.detail.eyebrow", undefined, "Specs")} · ${section.project?.name ?? t("console.specs.detail.projectFallback", undefined, "Project")}`}
        title={`${section.section_number} — ${section.title}`}
        subtitle={
          section.division
            ? `${section.division} · ${rfis.length} RFI${rfis.length === 1 ? "" : "s"} · ${submittals.length} submittal${submittals.length === 1 ? "" : "s"}`
            : `${rfis.length} RFI${rfis.length === 1 ? "" : "s"} · ${submittals.length} submittal${submittals.length === 1 ? "" : "s"}`
        }
        action={
          <Button href="/console/specs" size="sm" variant="ghost">
            {t("console.specs.detail.allSections", undefined, "← All Sections")}
          </Button>
        }
      />
      <div className="page-content space-y-6">
        <div className="surface flex flex-wrap items-center gap-3 p-3 text-xs">
          <Badge variant={toneFor(section.section_state)}>{toTitle(section.section_state)}</Badge>
          <span className="text-[var(--p-text-2)]">
            {t("console.specs.detail.formatLabel", undefined, "Format")} · {section.format}
          </span>
          {section.issued_at && (
            <span className="font-mono text-[var(--p-text-2)]">
              {t("console.specs.detail.issuedLabel", undefined, "Issued")} ·{" "}
              {fmt.dateParts(section.issued_at, { year: "numeric", month: "short", day: "numeric" })}
            </span>
          )}
          <span className="ms-auto flex gap-2">
            {section.section_state !== "issued" && section.section_state !== "superseded" && (
              <form action={issueSection}>
                <input type="hidden" name="section_id" value={section.id} />
                <Button type="submit" size="sm">
                  {t("console.specs.detail.issueAction", undefined, "Issue")}
                </Button>
              </form>
            )}
            {section.section_state === "issued" && (
              <form action={supersedeSection}>
                <input type="hidden" name="section_id" value={section.id} />
                <Button type="submit" size="sm" variant="ghost">
                  {t("console.specs.detail.markSupersededAction", undefined, "Mark Superseded")}
                </Button>
              </form>
            )}
          </span>
        </div>

        {section.body_md && (
          <section className="surface space-y-2 p-4">
            <h2 className="text-sm font-semibold">{t("console.specs.detail.bodyHeading", undefined, "Body")}</h2>
            <pre className="font-mono text-xs whitespace-pre-wrap text-[var(--p-text-2)]">{section.body_md}</pre>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">
            {t("console.specs.detail.linkedRfisHeading", { count: rfis.length }, "Linked RFIs")} ({rfis.length})
          </h2>
          {rfis.length === 0 ? (
            <p className="text-xs text-[var(--p-text-2)]">
              {t("console.specs.detail.noRfisLinked", undefined, "No RFIs linked to this section yet.")}
            </p>
          ) : (
            <ul className="space-y-1">
              {rfis.map((r) => (
                <li key={r.id} className="text-xs">
                  <a href={`/console/rfis/${r.id}`} className="font-mono">
                    {r.code}
                  </a>{" "}
                  · <span className="text-[var(--p-text-2)]">{r.title}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">
            {t("console.specs.detail.linkedSubmittalsHeading", { count: submittals.length }, "Linked Submittals")} (
            {submittals.length})
          </h2>
          {submittals.length === 0 ? (
            <p className="text-xs text-[var(--p-text-2)]">
              {t("console.specs.detail.noSubmittalsLinked", undefined, "No submittals linked to this section yet.")}
            </p>
          ) : (
            <ul className="space-y-1">
              {submittals.map((s) => (
                <li key={s.id} className="text-xs">
                  <a href={`/console/submittals/${s.id}`} className="font-mono">
                    {s.code}
                  </a>{" "}
                  · <span className="text-[var(--p-text-2)]">{s.title}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
