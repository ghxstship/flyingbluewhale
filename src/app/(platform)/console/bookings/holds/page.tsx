import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";

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
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Bookings" title="Holds" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
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
        eyebrow="Bookings"
        title="Holds"
        subtitle={`${rows.length} active hold${rows.length === 1 ? "" : "s"}`}
        action={
          <Button href="/console/bookings/holds/new" size="sm">
            + New Hold
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <DataTable<HoldRow>
          rows={rows}
          emptyLabel="No holds"
          emptyDescription="Place a tiered hold. Tier 1 has first refusal; releasing it auto-promotes Tier 2."
          emptyAction={
            <Button href="/console/bookings/holds/new" size="sm">
              + New Hold
            </Button>
          }
          columns={[
            {
              key: "tier",
              header: "Tier",
              render: (r) => <Badge variant={TIER_TONE[r.tier] ?? "muted"}>T{r.tier}</Badge>,
              accessor: (r) => Number(r.tier),
              filterable: true,
            },
            { key: "label", header: "Label", render: (r) => r.label ?? "—", accessor: (r) => r.label ?? null },
            {
              key: "starts",
              header: "Starts",
              render: (r) => new Date(r.starts_at).toLocaleString(),
              accessor: (r) => r.starts_at,
              className: "font-mono text-xs",
            },
            {
              key: "ends",
              header: "Ends",
              render: (r) => new Date(r.ends_at).toLocaleString(),
              accessor: (r) => r.ends_at,
              className: "font-mono text-xs",
            },
            {
              key: "auto",
              header: "Auto-release",
              render: (r) => (r.auto_release_on ? formatDate(r.auto_release_on, "short") : "—"),
              accessor: (r) => r.auto_release_on,
              className: "font-mono text-xs",
            },
            {
              key: "venue",
              header: "Venue",
              render: (r) => (r.venue_id ? <span className="font-mono text-xs">{r.venue_id.slice(0, 8)}</span> : "—"),
              accessor: (r) => r.venue_id ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
