import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/ui/MetricCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type HandoverState = Database["public"]["Enums"]["handover_state"];

type VenueRow = { id: string; name: string; handover_state: HandoverState };
type ItemRow = {
  id: string;
  category: string;
  description: string;
  status: string;
  due_at: string | null;
  resolved_at: string | null;
  notes: string | null;
};

const STATE_LABEL_KEY: Record<HandoverState, { key: string; fallback: string }> = {
  not_started: { key: "console.venues.handover.state.notStarted", fallback: "Not started" },
  inspection: { key: "console.venues.handover.state.inspection", fallback: "Inspection" },
  snag: { key: "console.venues.handover.state.snag", fallback: "Snag" },
  sign_off: { key: "console.venues.handover.state.signOff", fallback: "Sign-off" },
  accepted: { key: "console.venues.handover.state.accepted", fallback: "Accepted" },
  closeout: { key: "console.venues.handover.state.closeout", fallback: "Closeout" },
};

const STATE_TONE: Record<HandoverState, "muted" | "warning" | "info" | "success"> = {
  not_started: "muted",
  inspection: "info",
  snag: "warning",
  sign_off: "info",
  accepted: "success",
  closeout: "muted",
};

const ITEM_TONE: Record<string, "muted" | "info" | "warning" | "success" | "error"> = {
  open: "muted",
  in_progress: "info",
  blocked: "warning",
  passed: "success",
  failed: "error",
  waived: "muted",
};

export default async function Page({ params }: { params: Promise<{ venueId: string }> }) {
  const { venueId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.venues.handover.eyebrow", undefined, "Venue")}
          title={t("console.venues.handover.title", undefined, "Handover")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.venues.handover.configureSupabase", undefined, "Configure Supabase.")}
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
    return fmt.dateParts(iso, { month: "short", day: "numeric" });
  }
  const [{ data: venueData }, { data: itemData }] = await Promise.all([
    supabase
      .from("venues")
      .select("id, name, handover_state")
      .eq("id", venueId)
      .eq("org_id", session.orgId)
      .maybeSingle(),
    supabase
      .from("venue_handover_items")
      .select("id, category, description, status, due_at, resolved_at, notes")
      .eq("venue_id", venueId)
      .eq("org_id", session.orgId)
      .order("status", { ascending: true })
      .order("due_at", { ascending: true, nullsFirst: false }),
  ]);

  const venue = venueData as VenueRow | null;
  if (!venue) notFound();
  const items = ((itemData ?? []) as unknown as ItemRow[]) ?? [];

  const passed = items.filter((i) => i.status === "passed").length;
  const failed = items.filter((i) => i.status === "failed").length;
  const open = items.filter((i) => ["open", "in_progress", "blocked"].includes(i.status)).length;
  const completed = passed + items.filter((i) => i.status === "waived").length;
  const pct = items.length > 0 ? Math.round((completed / items.length) * 100) : 0;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.venues.handover.eyebrow", undefined, "Venue")}
        title={t("console.venues.handover.titleWithVenue", { name: venue.name }, `${venue.name} — Handover`)}
        subtitle={
          items.length === 1
            ? t("console.venues.handover.subtitleOne", { count: items.length }, `${items.length} commissioning item`)
            : t("console.venues.handover.subtitleOther", { count: items.length }, `${items.length} commissioning items`)
        }
        breadcrumbs={[
          { label: t("console.venues.breadcrumb", undefined, "Venues"), href: "/console/venues" },
          { label: venue.name, href: `/console/venues/${venue.id}` },
          { label: t("console.venues.handover.breadcrumb", undefined, "Handover") },
        ]}
        action={
          <Badge variant={STATE_TONE[venue.handover_state]}>
            {t(STATE_LABEL_KEY[venue.handover_state].key, undefined, STATE_LABEL_KEY[venue.handover_state].fallback)}
          </Badge>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.venues.handover.metrics.passed", undefined, "Passed")}
            value={fmt.number(passed)}
            accent
          />
          <MetricCard label={t("console.venues.handover.metrics.open", undefined, "Open")} value={fmt.number(open)} />
          <MetricCard
            label={t("console.venues.handover.metrics.failed", undefined, "Failed")}
            value={fmt.number(failed)}
          />
        </div>

        {items.length > 0 && (
          <section className="surface p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                {t("console.venues.handover.progress.title", undefined, "Commissioning Progress")}
              </h3>
              <span className="font-mono text-xs">{pct}%</span>
            </div>
            <ProgressBar value={pct} className="mt-3" />
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              {t(
                "console.venues.handover.progress.help",
                undefined,
                "Progress = (passed + waived) / total. Snags must be resolved before sign-off.",
              )}
            </p>
          </section>
        )}

        <DataTable<ItemRow>
          rows={items}
          emptyLabel={t("console.venues.handover.empty.label", undefined, "No handover items yet")}
          emptyDescription={t(
            "console.venues.handover.empty.description",
            undefined,
            "Author the commissioning checklist — overlay, MEP, IT, signage, broadcast, catering, medical, security, operations. Each item gets owned, due-dated, and signed off.",
          )}
          columns={[
            {
              key: "category",
              header: t("console.venues.handover.columns.category", undefined, "Category"),
              render: (r) => <Badge variant="muted">{toTitle(r.category)}</Badge>,
              accessor: (r) => r.category ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "desc",
              header: t("console.venues.handover.columns.item", undefined, "Item"),
              render: (r) => r.description,
              accessor: (r) => r.description,
            },
            {
              key: "due",
              header: t("console.venues.handover.columns.due", undefined, "Due"),
              render: (r) => <span className="font-mono text-xs">{fmtDate(r.due_at)}</span>,
              accessor: (r) => r.due_at ?? null,
            },
            {
              key: "resolved",
              header: t("console.venues.handover.columns.resolved", undefined, "Resolved"),
              render: (r) => <span className="font-mono text-xs">{fmtDate(r.resolved_at)}</span>,
              accessor: (r) => r.resolved_at ?? null,
            },
            {
              key: "status",
              header: t("console.venues.handover.columns.status", undefined, "Status"),
              render: (r) => <Badge variant={ITEM_TONE[r.status] ?? "muted"}>{toTitle(r.status)}</Badge>,
              filterable: true,
              groupable: true,
              accessor: (r) => r.status ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
