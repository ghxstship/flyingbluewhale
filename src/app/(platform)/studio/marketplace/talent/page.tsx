import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatFeeRange } from "@/lib/marketplace";
import { getRequestT } from "@/lib/i18n/request";

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
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.marketplace.talent.eyebrow", undefined, "Marketplace")}
          title={t("console.marketplace.talent.title", undefined, "Talent")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.marketplace.talent.configureSupabase", undefined, "Configure Supabase.")}
          </div>
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
        eyebrow={t("console.marketplace.talent.eyebrow", undefined, "Marketplace")}
        title={t("console.marketplace.talent.title", undefined, "Talent")}
        subtitle={`${rows.length} ${rows.length === 1 ? t("console.marketplace.talent.profileSingular", undefined, "Profile") : t("console.marketplace.talent.profilePlural", undefined, "Profiles")} · ${live} ${t("console.marketplace.talent.publicCount", undefined, "Public")}`}
        action={
          <Button href="/studio/marketplace/talent/new" size="sm">
            {t("console.marketplace.talent.newProfile", undefined, "+ New Profile")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <DataTable<TalentRow>
          rows={rows}
          rowHref={(r) => `/studio/marketplace/talent/${r.id}`}
          emptyLabel={t("console.marketplace.talent.emptyLabel", undefined, "No talent profiles yet")}
          emptyDescription={t(
            "console.marketplace.talent.emptyDescription",
            undefined,
            "A talent profile is the EPK: act, genre, fee band, riders, agent.",
          )}
          emptyAction={
            <Button href="/studio/marketplace/talent/new" size="sm">
              {t("console.marketplace.talent.newProfile", undefined, "+ New Profile")}
            </Button>
          }
          columns={[
            {
              key: "act",
              header: t("console.marketplace.talent.col.act", undefined, "Act"),
              render: (r) => r.act_name,
              accessor: (r) => r.act_name,
            },
            {
              key: "handle",
              header: t("console.marketplace.talent.col.handle", undefined, "Handle"),
              render: (r) => (r.public_handle ? <span className="font-mono text-xs">@{r.public_handle}</span> : "—"),
              accessor: (r) => r.public_handle ?? null,
            },
            {
              key: "genres",
              header: t("console.marketplace.talent.col.genres", undefined, "Genres"),
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
              header: t("console.marketplace.talent.col.feeBand", undefined, "Fee Band"),
              render: (r) => formatFeeRange(r.fee_min_cents, r.fee_max_cents, r.currency),
              accessor: (r) => Number(r.fee_max_cents ?? r.fee_min_cents ?? 0),
              className: "font-mono text-xs",
            },
            {
              key: "rating",
              header: t("console.marketplace.talent.col.rating", undefined, "Rating"),
              render: (r) => (r.rating_avg == null ? "—" : `★ ${r.rating_avg} (${r.rating_count})`),
              accessor: (r) => Number(r.rating_avg ?? 0),
              className: "font-mono text-xs",
            },
            {
              key: "verified",
              header: t("console.marketplace.talent.col.verified", undefined, "Verified"),
              render: (r) =>
                r.verified_at ? (
                  <Badge variant="success">{t("console.marketplace.talent.verified", undefined, "verified")}</Badge>
                ) : (
                  "—"
                ),
              accessor: (r) => (r.verified_at ? "verified" : "no"),
              filterable: true,
            },
            {
              key: "public",
              header: t("console.marketplace.talent.col.visibility", undefined, "Visibility"),
              render: (r) => (
                <Badge variant={r.is_public ? "success" : "muted"}>
                  {r.is_public
                    ? t("console.marketplace.talent.public", undefined, "public")
                    : t("console.marketplace.talent.private", undefined, "private")}
                </Badge>
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
