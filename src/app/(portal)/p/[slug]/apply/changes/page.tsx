import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type ChangeRow = {
  id: string;
  kind: string;
  status: string;
  note: string | null;
  created_at: string;
  decided_at: string | null;
  accreditation: { id: string; person_name: string } | null;
};

const STATUS_TONE: Record<string, "muted" | "info" | "warning" | "success" | "error"> = {
  requested: "info",
  in_review: "warning",
  approved: "success",
  rejected: "error",
  cancelled: "muted",
};

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t } = await getRequestT();
  const KIND_LABEL: Record<string, string> = {
    upgrade: t("p.apply.changes.kind.upgrade", undefined, "Category upgrade"),
    downgrade: t("p.apply.changes.kind.downgrade", undefined, "Category downgrade"),
    zone_add: t("p.apply.changes.kind.zone_add", undefined, "Add zone"),
    zone_remove: t("p.apply.changes.kind.zone_remove", undefined, "Remove zone"),
    replacement: t("p.apply.changes.kind.replacement", undefined, "Card replacement"),
    reissue: t("p.apply.changes.kind.reissue", undefined, "Reissue — Lost / Damaged"),
    name_change: t("p.apply.changes.kind.name_change", undefined, "Name change"),
    photo_update: t("p.apply.changes.kind.photo_update", undefined, "Photo update"),
  };
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("p.apply.changes.eyebrowShort", undefined, "Portal")}
          title={t("p.apply.changes.title", undefined, "Card Changes")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("p.apply.changes.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();

  function fmtDate(iso: string | null): string {
    if (!iso) return "—";
    return fmt.dateParts(iso, { month: "short", day: "numeric", year: "numeric" });
  }
  // Filter to changes the requester filed themselves.
  const { data } = await supabase
    .from("accreditation_changes")
    .select("id, kind, change_state, note, created_at, decided_at, accreditation:accreditation_id(id, person_name)")
    .eq("org_id", session.orgId)
    .eq("requested_by", session.userId)
    .order("created_at", { ascending: false });

  const changes = ((data ?? []) as unknown as ChangeRow[]) ?? [];
  const open = changes.filter((c) => c.status === "requested" || c.status === "in_review").length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("p.apply.changes.eyebrow", undefined, "Portal · Apply")}
        title={t("p.apply.changes.title", undefined, "Card Changes")}
        subtitle={
          changes.length === 1
            ? t("p.apply.changes.subtitle.one", { open: fmt.number(open) }, `${changes.length} Request · ${open} Open`)
            : t(
                "p.apply.changes.subtitle.other",
                { count: fmt.number(changes.length), open: fmt.number(open) },
                `${changes.length} Requests · ${open} Open`,
              )
        }
        breadcrumbs={[
          { label: t("p.apply.changes.breadcrumbs.portal", undefined, "Portal"), href: `/p/${slug}` },
          { label: t("p.apply.changes.breadcrumbs.apply", undefined, "Apply"), href: `/p/${slug}/apply` },
          { label: t("p.apply.changes.breadcrumbs.changes", undefined, "Changes") },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label={t("p.apply.changes.metric.open", undefined, "Open")} value={fmt.number(open)} />
          <MetricCard
            label={t("p.apply.changes.metric.approved", undefined, "Approved")}
            value={fmt.number(changes.filter((c) => c.status === "approved").length)}
          />
          <MetricCard
            label={t("p.apply.changes.metric.rejected", undefined, "Rejected")}
            value={fmt.number(changes.filter((c) => c.status === "rejected").length)}
          />
        </div>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">
            {t("p.apply.changes.howItWorks.title", undefined, "How This Works")}
          </h3>
          <p className="mt-1 text-xs text-[var(--p-text-2)]">
            {t(
              "p.apply.changes.howItWorks.body",
              undefined,
              "Use this page to request changes to an existing card — upgrades, replacements, zone adjustments, or corrections. Producer reviews each request; approval may require resubmitting your photo or vetting docs.",
            )}
          </p>
        </section>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">
            {t("p.apply.changes.yourRequests.title", undefined, "Your Requests")}
          </h3>
          {changes.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--p-text-2)]">
              {t("p.apply.changes.yourRequests.empty", undefined, "No card-change requests on file yet.")}
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--p-border)]">
              {changes.map((c) => (
                <li key={c.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium">{KIND_LABEL[c.kind] ?? c.kind}</div>
                    <div className="font-mono text-[10px] text-[var(--p-text-2)]">
                      {c.accreditation?.person_name ?? "—"} ·{" "}
                      {t("p.apply.changes.filed", { date: fmtDate(c.created_at) }, `filed ${fmtDate(c.created_at)}`)}
                      {c.decided_at
                        ? ` · ${t("p.apply.changes.decided", { date: fmtDate(c.decided_at) }, `decided ${fmtDate(c.decided_at)}`)}`
                        : ""}
                    </div>
                    {c.note && <p className="mt-1 text-xs text-[var(--p-text-2)]">{c.note}</p>}
                  </div>
                  <Badge variant={STATUS_TONE[c.status] ?? "muted"}>{toTitle(c.status)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
