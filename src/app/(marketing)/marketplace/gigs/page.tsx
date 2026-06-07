import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { MarketplaceCard } from "@/components/marketplace/MarketplaceCard";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { buildMetadata } from "@/lib/seo";
import { formatFeeRange } from "@/lib/marketplace";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t("marketing.pages.marketplace.gigs.meta.title"),
    description: t("marketing.pages.marketplace.gigs.meta.description"),
    path: "/marketplace/gigs",
  });
}

type Row = {
  id: string;
  public_slug: string;
  title: string;
  description: string | null;
  role_taxonomy: string[];
  region: string | null;
  city: string | null;
  country: string | null;
  employment_type: string;
  day_rate_min_cents: number | null;
  day_rate_max_cents: number | null;
  currency: string;
  posting_type: string;
  union_required: string[];
  travel_paid: boolean;
  lodging_provided: boolean;
  applicant_count: number;
  expires_at: string | null;
  org_name: string;
  org_slug: string;
};

export default async function Page() {
  const { t } = await getRequestT();
  let rows: Row[] = [];
  if (hasSupabase) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("public_job_board")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(60);
    rows = (data ?? []) as Row[];
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: t("marketing.pages.marketplace.gigs.breadcrumbs.marketplace"), href: "/marketplace" },
          { label: t("marketing.pages.marketplace.gigs.breadcrumbs.crewGigs") },
        ]}
        className="mx-auto max-w-6xl px-6 pt-6"
      />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">{t("marketing.pages.marketplace.gigs.hero.eyebrow")}</div>
        <h1 className="hed-2xl mt-4">{t("marketing.pages.marketplace.gigs.hero.title")}</h1>
        <p className="mt-3 text-sm text-[var(--p-text-2)]">
          {rows.length}{" "}
          {rows.length === 1
            ? t("marketing.pages.marketplace.gigs.hero.liveGigSingular")
            : t("marketing.pages.marketplace.gigs.hero.liveGigPlural")}{" "}
          · {t("marketing.pages.marketplace.gigs.hero.subtitle")}
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        {rows.length === 0 ? (
          <div className="surface p-6 text-sm text-[var(--p-text-2)]">
            {t("marketing.pages.marketplace.gigs.empty")}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => (
              <MarketplaceCard
                key={r.id}
                href={`/marketplace/gigs/${r.public_slug}`}
                title={r.title}
                subtitle={r.org_name}
                tags={r.role_taxonomy}
                meta={[
                  [r.city, r.region, r.country].filter(Boolean).join(", ") || null,
                  formatFeeRange(r.day_rate_min_cents, r.day_rate_max_cents, r.currency) +
                    t("marketing.pages.marketplace.gigs.meta.perDay"),
                  r.posting_type,
                  r.travel_paid ? t("marketing.pages.marketplace.gigs.meta.travelPaid") : null,
                  r.lodging_provided ? t("marketing.pages.marketplace.gigs.meta.lodgingProvided") : null,
                ]}
                badge={r.union_required.length > 0 ? r.union_required[0] : null}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
