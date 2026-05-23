import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatFeeRange } from "@/lib/marketplace";

export const dynamic = "force-dynamic";

type TalentRow = {
  id: string;
  act_name: string;
  public_handle: string | null;
  is_public: boolean;
  genre_tags: string[];
  fee_min_cents: number | null;
  fee_max_cents: number | null;
  currency: string;
  rating_avg: number | null;
  rating_count: number;
  verified_at: string | null;
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Marketplace" title="Talent" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("talent_profiles")
    .select(
      "id, act_name, public_handle, is_public, genre_tags, fee_min_cents, fee_max_cents, currency, rating_avg, rating_count, verified_at",
    )
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(500);

  const rows = (data ?? []) as TalentRow[];
  const live = rows.filter((r) => r.is_public).length;

  return (
    <>
      <ModuleHeader
        eyebrow="Marketplace"
        title="Talent"
        subtitle={`${rows.length} ${rows.length === 1 ? "Profile" : "Profiles"} · ${live} Public`}
        action={
          <Button href="/console/marketplace/talent/new" size="sm">
            + New Profile
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <DataTable<TalentRow>
          rows={rows}
          rowHref={(r) => `/console/marketplace/talent/${r.id}`}
          emptyLabel="No talent profiles yet"
          emptyDescription="A talent profile is the EPK: act, genre, fee band, riders, agent."
          emptyAction={
            <Button href="/console/marketplace/talent/new" size="sm">
              + New Profile
            </Button>
          }
          columns={[
            { key: "act", header: "Act", render: (r) => r.act_name, accessor: (r) => r.act_name },
            {
              key: "handle",
              header: "Handle",
              render: (r) => (r.public_handle ? <span className="font-mono text-xs">@{r.public_handle}</span> : "—"),
              accessor: (r) => r.public_handle ?? null,
            },
            {
              key: "genres",
              header: "Genres",
              render: (r) =>
                r.genre_tags.length === 0 ? (
                  "—"
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {r.genre_tags.slice(0, 3).map((g) => (
                      <Badge key={g} variant="muted">
                        {g}
                      </Badge>
                    ))}
                  </div>
                ),
              accessor: (r) => r.genre_tags.join(",") || null,
            },
            {
              key: "fee",
              header: "Fee Band",
              render: (r) => formatFeeRange(r.fee_min_cents, r.fee_max_cents, r.currency),
              accessor: (r) => Number(r.fee_max_cents ?? r.fee_min_cents ?? 0),
              className: "font-mono text-xs",
            },
            {
              key: "rating",
              header: "Rating",
              render: (r) => (r.rating_avg == null ? "—" : `★ ${r.rating_avg} (${r.rating_count})`),
              accessor: (r) => Number(r.rating_avg ?? 0),
              className: "font-mono text-xs",
            },
            {
              key: "verified",
              header: "Verified",
              render: (r) => (r.verified_at ? <Badge variant="success">verified</Badge> : "—"),
              accessor: (r) => (r.verified_at ? "verified" : "no"),
              filterable: true,
            },
            {
              key: "public",
              header: "Visibility",
              render: (r) => (
                <Badge variant={r.is_public ? "success" : "muted"}>{r.is_public ? "public" : "private"}</Badge>
              ),
              accessor: (r) => (r.is_public ? "public" : "private"),
              filterable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
