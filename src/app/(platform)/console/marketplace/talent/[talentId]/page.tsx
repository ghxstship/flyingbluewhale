import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { formatFeeRange } from "@/lib/marketplace";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { TalentVisibility } from "./TalentVisibility";

export const dynamic = "force-dynamic";

type SocialEntry = { handle?: string; followers?: number; subscribers?: number; monthly_listeners?: number };

type Talent = {
  id: string;
  act_name: string;
  public_handle: string | null;
  tagline: string | null;
  bio: string | null;
  genre_tags: string[];
  fee_min_cents: number | null;
  fee_max_cents: number | null;
  currency: string;
  travel_radius_km: number | null;
  deposit_pct: number;
  agent_name: string | null;
  agent_email: string | null;
  video_reel_url: string | null;
  is_public: boolean;
  verified_at: string | null;
  rating_avg: number | null;
  rating_count: number;
  social_links: Record<string, SocialEntry> | null;
};

export default async function Page({ params }: { params: Promise<{ talentId: string }> }) {
  const { talentId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();
  const { data } = await supabase
    .from("talent_profiles")
    .select("*")
    .eq("id", talentId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) return notFound();
  const talent = data as Talent;

  const ridersResp = await supabase
    .from("talent_riders")
    .select("id, kind, version, is_current")
    .eq("talent_profile_id", talent.id)
    .order("kind");
  const riders = (ridersResp.data ?? []) as Array<{ id: string; kind: string; version: number; is_current: boolean }>;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.marketplace.talent.detail.eyebrow", undefined, "Marketplace · Talent")}
        title={talent.act_name}
        subtitle={talent.tagline ?? undefined}
        action={
          <div className="flex items-center gap-2">
            {talent.verified_at && (
              <Badge variant="success">{t("console.marketplace.talent.detail.verified", undefined, "Verified")}</Badge>
            )}
            <Badge variant={talent.is_public ? "success" : "muted"}>
              {talent.is_public
                ? t("console.marketplace.talent.detail.published", undefined, "Published")
                : t("console.marketplace.talent.detail.private", undefined, "Private")}
            </Badge>
            <Button href={`/console/marketplace/talent/${talent.id}/riders`} size="sm" variant="ghost">
              {t("console.marketplace.talent.detail.riders", undefined, "Riders")}
            </Button>
            <Button href={`/console/marketplace/talent/${talent.id}/edit`} size="sm" variant="ghost">
              {t("common.edit", undefined, "Edit")}
            </Button>
          </div>
        }
      />
      <div className="page-content space-y-5">
        <TalentVisibility talentId={talent.id} isPublic={talent.is_public} publicHandle={talent.public_handle} />

        <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="surface p-5">
            <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">
              {t("console.marketplace.talent.detail.bio", undefined, "Bio")}
            </h2>
            <div className="text-sm whitespace-pre-wrap">{talent.bio ?? "—"}</div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {talent.genre_tags.map((g) => (
                <Badge key={g} variant="muted">
                  {g}
                </Badge>
              ))}
            </div>
          </div>
          <div className="surface p-5">
            <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">
              {t("console.marketplace.talent.detail.booking", undefined, "Booking")}
            </h2>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-[var(--p-text-2)]">
                {t("console.marketplace.talent.detail.feeBand", undefined, "Fee band")}
              </dt>
              <dd>{formatFeeRange(talent.fee_min_cents, talent.fee_max_cents, talent.currency)}</dd>
              <dt className="text-[var(--p-text-2)]">
                {t("console.marketplace.talent.detail.travelRadius", undefined, "Travel radius")}
              </dt>
              <dd>{talent.travel_radius_km ? `${talent.travel_radius_km} km` : "—"}</dd>
              <dt className="text-[var(--p-text-2)]">
                {t("console.marketplace.talent.detail.deposit", undefined, "Deposit")}
              </dt>
              <dd>{talent.deposit_pct}%</dd>
              <dt className="text-[var(--p-text-2)]">
                {t("console.marketplace.talent.detail.agent", undefined, "Agent")}
              </dt>
              <dd>
                {talent.agent_name ?? "—"}
                {talent.agent_email ? ` <${talent.agent_email}>` : ""}
              </dd>
              <dt className="text-[var(--p-text-2)]">
                {t("console.marketplace.talent.detail.reel", undefined, "Reel")}
              </dt>
              <dd>
                {talent.video_reel_url ? (
                  <a
                    href={talent.video_reel_url}
                    target="_blank"
                    rel="noopener"
                    className="font-mono text-xs text-[var(--p-accent)]"
                  >
                    {t("console.marketplace.talent.detail.watch", undefined, "Watch ↗")}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
              <dt className="text-[var(--p-text-2)]">
                {t("console.marketplace.talent.detail.rating", undefined, "Rating")}
              </dt>
              <dd>
                {talent.rating_avg == null
                  ? t("console.marketplace.talent.detail.noReviewsYet", undefined, "no reviews yet")
                  : `★ ${talent.rating_avg} (${talent.rating_count})`}
              </dd>
            </dl>
          </div>
        </section>

        {talent.social_links && Object.keys(talent.social_links).length > 0 && (
          <section className="surface p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide">
              {t("console.marketplace.talent.detail.socialLinks", undefined, "Social Profiles")}
            </h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
              {Object.entries(talent.social_links).map(([platform, entry]) => {
                if (!entry?.handle) return null;
                const count = entry.monthly_listeners ?? entry.subscribers ?? entry.followers;
                return (
                  <div key={platform}>
                    <dt className="text-xs uppercase tracking-wide text-[var(--p-text-2)] capitalize">{platform}</dt>
                    <dd className="font-mono text-xs mt-0.5">
                      @{entry.handle}
                      {count != null && (
                        <span className="ml-1.5 text-[var(--p-text-2)]">
                          · {count.toLocaleString()}
                        </span>
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        )}

        <section className="surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide uppercase">
              {t("console.marketplace.talent.detail.currentRiders", undefined, "Current Riders")}
            </h2>
            <Button href={`/console/marketplace/talent/${talent.id}/riders/new`} size="sm" variant="ghost">
              {t("console.marketplace.talent.detail.addRider", undefined, "+ Add Rider")}
            </Button>
          </div>
          {riders.length === 0 ? (
            <EmptyState
              size="compact"
              title={t("console.marketplace.talent.detail.noRidersTitle", undefined, "No riders attached yet")}
            />
          ) : (
            <ul className="divide-y divide-[var(--border-subtle)] text-sm">
              {riders.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2">
                  <span>
                    {toTitle(r.kind)} · v{r.version}
                  </span>
                  {r.is_current && (
                    <Badge variant="success">
                      {t("console.marketplace.talent.detail.current", undefined, "Current")}
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
