import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type HoldRow = {
  id: string;
  tier: number;
  starts_at: string;
  ends_at: string;
  label: string | null;
  auto_release_on: string | null;
  venue_id: string | null;
  talent_profile_id: string | null;
};

const TIER_TONE: Record<number, "success" | "info" | "warning" | "muted"> = {
  1: "success",
  2: "info",
  3: "warning",
  4: "muted",
  5: "muted",
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.bookings.holds.eyebrow", undefined, "Bookings")}
          title={t("console.bookings.holds.title", undefined, "Holds")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.bookings.holds.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("availability_slots")
    .select("id, tier, starts_at, ends_at, label, auto_release_on, venue_id, talent_profile_id")
    .eq("kind", "hold")
    .eq("user_id", session.userId)
    .order("starts_at", { ascending: true })
    .limit(500);

  const rows = (data ?? []) as HoldRow[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.bookings.holds.eyebrow", undefined, "Bookings")}
        title={t("console.bookings.holds.title", undefined, "Holds")}
        subtitle={t(
          "console.bookings.holds.subtitle",
          { count: rows.length, plural: rows.length === 1 ? "" : "s" },
          `${rows.length} Active  hold${rows.length === 1 ? "" : "s"}`,
        )}
        action={
          <Button href="/console/bookings/holds/new" size="sm">
            {t("console.bookings.holds.newHold", undefined, "+ New Hold")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <DataTable<HoldRow>
          rows={rows}
          emptyLabel={t("console.bookings.holds.emptyLabel", undefined, "No holds")}
          emptyDescription={t(
            "console.bookings.holds.emptyDescription",
            undefined,
            "Place a tiered hold. Tier 1 has first refusal; releasing it auto-promotes Tier 2.",
          )}
          emptyAction={
            <Button href="/console/bookings/holds/new" size="sm">
              {t("console.bookings.holds.newHold", undefined, "+ New Hold")}
            </Button>
          }
          columns={[
            {
              key: "tier",
              header: t("console.bookings.holds.col.tier", undefined, "Tier"),
              render: (r) => <Badge variant={TIER_TONE[r.tier] ?? "muted"}>T{r.tier}</Badge>,
              accessor: (r) => Number(r.tier),
              filterable: true,
            },
            {
              key: "label",
              header: t("console.bookings.holds.col.label", undefined, "Label"),
              render: (r) => r.label ?? "—",
              accessor: (r) => r.label ?? null,
            },
            {
              key: "starts",
              header: t("console.bookings.holds.col.starts", undefined, "Starts"),
              render: (r) => new Date(r.starts_at).toLocaleString(),
              accessor: (r) => r.starts_at,
              className: "font-mono text-xs",
            },
            {
              key: "ends",
              header: t("console.bookings.holds.col.ends", undefined, "Ends"),
              render: (r) => new Date(r.ends_at).toLocaleString(),
              accessor: (r) => r.ends_at,
              className: "font-mono text-xs",
            },
            {
              key: "auto",
              header: t("console.bookings.holds.col.autoRelease", undefined, "Auto-release"),
              render: (r) => (r.auto_release_on ? new Date(r.auto_release_on).toLocaleDateString() : "—"),
              accessor: (r) => r.auto_release_on,
              className: "font-mono text-xs",
            },
            {
              key: "venue",
              header: t("console.bookings.holds.col.venue", undefined, "Venue"),
              render: (r) => (r.venue_id ? <span className="font-mono text-xs">{r.venue_id.slice(0, 8)}</span> : "—"),
              accessor: (r) => r.venue_id ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
