import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type Visa = {
  id: string;
  person_name: string;
  nationality: string | null;
  passport_no: string | null;
  status: string;
  letter_path: string | null;
  delegation: { name: string | null } | null;
  updated_at: string;
};

const STATUS_TONE: Record<string, "muted" | "info" | "warning" | "success" | "error"> = {
  pending: "muted",
  documents_in: "info",
  letter_issued: "success",
  application_filed: "warning",
  approved: "success",
  denied: "error",
};

function maskPassport(pass: string | null): string {
  if (!pass) return "—";
  if (pass.length <= 4) return "••" + pass;
  return `${pass.slice(0, 2)}•••••${pass.slice(-2)}`;
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("p.shared.portal", undefined, "Portal")}
          title={t("p.athlete.visa.title", undefined, "Visa Cases")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">{t("p.shared.configureSupabase", undefined, "Configure Supabase.")}</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const fmtDate = (iso: string): string => fmt.dateParts(iso, { month: "short", day: "numeric", year: "numeric" });
  // Visa cases are typically filed by the delegation; we surface every row visible
  // to the viewer via RLS so they can see status of their travel docs.
  const { data } = await supabase
    .from("visa_cases")
    .select(
      "id, person_name, nationality, passport_no, status:case_state, letter_path, delegation:delegation_id(name), updated_at",
    )
    .eq("org_id", session.orgId)
    .order("updated_at", { ascending: false });

  const cases = ((data ?? []) as unknown as Visa[]) ?? [];
  const pending = cases.filter((c) => c.status !== "approved" && c.status !== "denied").length;
  const approved = cases.filter((c) => c.status === "approved").length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("p.athlete.visa.eyebrow", undefined, "Portal · Athlete")}
        title={t("p.athlete.visa.title", undefined, "Visa Cases")}
        subtitle={
          cases.length === 1
            ? t(
                "p.athlete.visa.subtitleOne",
                { pending: fmt.number(pending) },
                `${cases.length} Case · ${pending} in progress`,
              )
            : t(
                "p.athlete.visa.subtitleMany",
                { count: fmt.number(cases.length), pending: fmt.number(pending) },
                `${cases.length} Cases · ${pending} in progress`,
              )
        }
        breadcrumbs={[
          { label: t("p.shared.portal", undefined, "Portal"), href: `/p/${slug}` },
          { label: t("p.athlete.breadcrumbLabel", undefined, "Athlete"), href: `/p/${slug}/athlete` },
          { label: t("p.athlete.visa.breadcrumb", undefined, "Visa") },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("p.athlete.visa.metric.approved", undefined, "Approved")}
            value={fmt.number(approved)}
            accent={approved > 0}
          />
          <MetricCard
            label={t("p.athlete.visa.metric.inProgress", undefined, "In Progress")}
            value={fmt.number(pending)}
          />
          <MetricCard label={t("p.athlete.visa.metric.total", undefined, "Total")} value={fmt.number(cases.length)} />
        </div>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">{t("p.athlete.visa.section.title", undefined, "Your Visa Cases")}</h3>
          {cases.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--p-text-2)]">
              {t(
                "p.athlete.visa.empty",
                undefined,
                "No cases on file. Your delegation lead opens these on your behalf — they'll request your passport details directly.",
              )}
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--p-border)]">
              {cases.map((c) => (
                <li key={c.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium">{c.person_name}</div>
                    <div className="font-mono text-[10px] text-[var(--p-text-2)]">
                      {c.nationality ?? "—"} · {t("p.athlete.visa.passportLabel", undefined, "passport")}{" "}
                      {maskPassport(c.passport_no)}
                      {c.delegation?.name ? ` · ${c.delegation.name}` : ""}
                    </div>
                    {c.letter_path && (
                      <div className="mt-1 font-mono text-[10px] text-[var(--p-accent)]">
                        {t("p.athlete.visa.letterOnFile", undefined, "letter on file")}
                      </div>
                    )}
                    <div className="font-mono text-[10px] text-[var(--p-text-2)]">
                      {t("p.athlete.visa.updated", { date: fmtDate(c.updated_at) }, `updated ${fmtDate(c.updated_at)}`)}
                    </div>
                  </div>
                  <Badge variant={STATUS_TONE[c.status] ?? "muted"}>{toTitle(c.status)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-xs text-[var(--p-text-2)]">
          {t(
            "p.athlete.visa.footer.prefix",
            undefined,
            "Passport numbers are masked on screen but retained for letter generation. Email",
          )}{" "}
          <a className="text-[var(--p-accent)]" href="mailto:visas@atlvs.pro">
            visas@atlvs.pro
          </a>{" "}
          {t("p.athlete.visa.footer.suffix", undefined, "if your case isn't progressing.")}
        </p>
      </div>
    </>
  );
}
