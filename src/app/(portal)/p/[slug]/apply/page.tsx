import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { FormShell } from "@/components/FormShell";
import { FormField } from "@/components/ui/FormField";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { submitAccreditationApplication } from "./actions";

export const dynamic = "force-dynamic";

type Acc = {
  id: string;
  person_name: string;
  state: string;
  vetting: string;
  issued_at: string | null;
  valid_from: string | null;
  valid_to: string | null;
  category: { code: string; name: string } | null;
};

const STATE_TONE: Record<string, "muted" | "info" | "warning" | "success" | "error"> = {
  applied: "info",
  vetting: "warning",
  approved: "info",
  issued: "success",
  suspended: "warning",
  revoked: "error",
};

const VETTING_TONE: Record<string, "muted" | "info" | "warning" | "success" | "error"> = {
  pending: "muted",
  in_progress: "info",
  clear: "success",
  flagged: "warning",
  failed: "error",
};

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("p.shared.eyebrow.portal", undefined, "Portal")}
          title={t("p.apply.title", undefined, "Apply")}
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

  function fmtDate(iso: string | null): string {
    if (!iso) return t("common.emDash", undefined, "—");
    return fmt.dateParts(iso, { month: "short", day: "numeric", year: "numeric" });
  }
  const [{ data }, { data: categoryRows }] = await Promise.all([
    supabase
      .from("accreditations")
      .select("id, person_name, state, vetting, issued_at, valid_from, valid_to, category:category_id(code, name)")
      .eq("org_id", session.orgId)
      .eq("user_id", session.userId)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("accreditation_categories")
      .select("id, code, name")
      .eq("org_id", session.orgId)
      .order("code", { ascending: true })
      .limit(200),
  ]);
  const categories = (categoryRows ?? []) as Array<{ id: string; code: string; name: string }>;

  const apps = ((data ?? []) as unknown as Acc[]) ?? [];
  const issued = apps.filter((a) => a.state === "issued").length;
  const inFlight = apps.filter((a) => ["applied", "vetting", "approved"].includes(a.state)).length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("p.shared.eyebrow.portal", undefined, "Portal")}
        title={t("p.apply.headerTitle", undefined, "Accreditation")}
        subtitle={
          apps.length === 1
            ? t(
                "p.apply.subtitle.one",
                { count: fmt.number(apps.length) },
                `${fmt.number(apps.length)} Application On File`,
              )
            : t(
                "p.apply.subtitle.other",
                { count: fmt.number(apps.length) },
                `${fmt.number(apps.length)} Applications On File`,
              )
        }
        breadcrumbs={[
          { label: t("p.shared.eyebrow.portal", undefined, "Portal"), href: `/p/${slug}` },
          { label: t("p.apply.title", undefined, "Apply") },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("p.apply.metric.issued", undefined, "Issued")}
            value={fmt.number(issued)}
            accent={issued > 0}
          />
          <MetricCard label={t("p.apply.metric.inReview", undefined, "In Review")} value={fmt.number(inFlight)} />
          <MetricCard label={t("p.apply.metric.total", undefined, "Total")} value={fmt.number(apps.length)} />
        </div>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">{t("p.apply.start.title", undefined, "Start a New Application")}</h3>
          <p className="mt-1 text-xs text-[var(--p-text-2)]">
            {t(
              "p.apply.start.description",
              undefined,
              "Apply for accreditation against any of the project's published categories. We verify identity, check zone access, and issue your card on approval.",
            )}
          </p>
          {categories.length > 0 ? (
            <div className="mt-4">
              <FormShell
                action={submitAccreditationApplication}
                submitLabel={t("p.apply.form.submit", undefined, "Submit Application")}
              >
                <input type="hidden" name="slug" value={slug} />
                <FormField label={t("p.apply.form.name", undefined, "Full name (as it should print on the card)")} required>
                  <input name="personName" required maxLength={160} className="ps-input w-full" />
                </FormField>
                <FormField label={t("p.apply.form.category", undefined, "Category")} required>
                  <select name="categoryId" required defaultValue="" className="ps-input w-full">
                    <option value="" disabled>
                      {t("p.apply.form.categoryPlaceholder", undefined, "Pick a category")}
                    </option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} · {c.name}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label={t("p.apply.form.note", undefined, "Anything the team should know?")}>
                  <textarea name="note" rows={3} maxLength={1000} className="ps-input w-full" />
                </FormField>
              </FormShell>
            </div>
          ) : (
            <p className="mt-3 text-xs text-[var(--p-text-2)]">
              {t(
                "p.apply.form.noCategories",
                undefined,
                "Categories haven't been published for this event yet. Email the team below and they'll get you started.",
              )}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/p/${slug}/apply/changes`} className="ps-btn ps-btn--ghost ps-btn--sm">
              {t("p.apply.start.requestChange", undefined, "Request a category change")}
            </Link>
            <Link
              href={`mailto:accreditation@atlvs.pro?subject=${encodeURIComponent(`New application: ${slug}`)}`}
              className="ps-btn ps-btn--ghost ps-btn--sm"
            >
              {t("p.apply.start.emailProducer", undefined, "Email the accreditation team")}
            </Link>
          </div>
        </section>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">{t("p.apply.list.title", undefined, "Your Applications")}</h3>
          {apps.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--p-text-2)]">
              {t("p.apply.list.empty", undefined, "No applications yet — your producer will invite you.")}
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--p-border)]">
              {apps.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <div className="font-medium">{a.person_name}</div>
                    <div className="font-mono text-[11px] text-[var(--p-text-2)]">
                      {a.category?.code ?? t("common.emDash", undefined, "—")} · {a.category?.name ?? ""}
                      {a.valid_from && a.valid_to ? ` · ${fmtDate(a.valid_from)} – ${fmtDate(a.valid_to)}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={VETTING_TONE[a.vetting] ?? "muted"}>{toTitle(a.vetting)}</Badge>
                    <Badge variant={STATE_TONE[a.state] ?? "muted"}>{toTitle(a.state)}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
