import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { formatFeeRange } from "@/lib/marketplace";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

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
  certs_required: string[];
  travel_paid: boolean;
  lodging_provided: boolean;
  applicant_count: number;
  expires_at: string | null;
  org_name: string;
  org_slug: string;
};

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) return notFound();
  const supabase = await createClient();
  const { data } = await supabase.from("public_job_board").select("*").eq("public_slug", slug).maybeSingle();
  if (!data) return notFound();
  const r = data as Row;
  const { t } = await getRequestT();

  return (
    <>
      <Breadcrumbs
        items={[
          { label: t("marketing.pages.marketplace-gigs-detail.breadcrumbs.marketplace"), href: "/marketplace" },
          { label: t("marketing.pages.marketplace-gigs-detail.breadcrumbs.crewGigs"), href: "/marketplace/gigs" },
          { label: r.title },
        ]}
        className="mx-auto max-w-6xl px-6 pt-6"
      />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">
          {t("marketing.pages.marketplace-gigs-detail.hero.eyebrow")} · {r.org_name}
        </div>
        <h1 className="hed-2xl mt-4">{r.title}</h1>
        <div className="mt-5 flex flex-wrap gap-2">
          <Badge variant="muted">{toTitle(r.posting_type)}</Badge>
          <Badge variant="muted">{r.employment_type.toUpperCase()}</Badge>
          {[r.city, r.region, r.country].filter(Boolean).length > 0 && (
            <Badge variant="muted">{[r.city, r.region, r.country].filter(Boolean).join(", ")}</Badge>
          )}
          <Badge variant="info">
            {formatFeeRange(r.day_rate_min_cents, r.day_rate_max_cents, r.currency)}
            {t("marketing.pages.marketplace-gigs-detail.hero.perDay")}
          </Badge>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-6 px-6 pb-16">
        <div className="surface p-5">
          <h2 className="hed-md mb-3">{t("marketing.pages.marketplace-gigs-detail.about.title")}</h2>
          <div className="text-sm whitespace-pre-wrap">{r.description ?? "—"}</div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="surface p-5">
            <h2 className="hed-md mb-3">{t("marketing.pages.marketplace-gigs-detail.roles.title")}</h2>
            <div className="flex flex-wrap gap-1.5">
              {r.role_taxonomy.length === 0 ? (
                <span className="text-sm text-[var(--text-secondary)]">—</span>
              ) : (
                r.role_taxonomy.map((t) => (
                  <Badge key={t} variant="muted">
                    {t}
                  </Badge>
                ))
              )}
            </div>
          </div>
          <div className="surface p-5">
            <h2 className="hed-md mb-3">{t("marketing.pages.marketplace-gigs-detail.requirements.title")}</h2>
            <dl className="space-y-1 text-sm">
              <div>
                <span className="text-[var(--text-secondary)]">
                  {t("marketing.pages.marketplace-gigs-detail.requirements.unions")}
                </span>{" "}
                {r.union_required.join(", ") || "—"}
              </div>
              <div>
                <span className="text-[var(--text-secondary)]">
                  {t("marketing.pages.marketplace-gigs-detail.requirements.certs")}
                </span>{" "}
                {r.certs_required.join(", ") || "—"}
              </div>
              <div>
                <span className="text-[var(--text-secondary)]">
                  {t("marketing.pages.marketplace-gigs-detail.requirements.travel")}
                </span>{" "}
                {r.travel_paid
                  ? t("marketing.pages.marketplace-gigs-detail.requirements.travelPaid")
                  : t("marketing.pages.marketplace-gigs-detail.requirements.travelNotPaid")}
              </div>
              <div>
                <span className="text-[var(--text-secondary)]">
                  {t("marketing.pages.marketplace-gigs-detail.requirements.lodging")}
                </span>{" "}
                {r.lodging_provided
                  ? t("marketing.pages.marketplace-gigs-detail.requirements.lodgingProvided")
                  : t("marketing.pages.marketplace-gigs-detail.requirements.lodgingNotProvided")}
              </div>
            </dl>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button href={`/login?redirect=/marketplace/gigs/${r.public_slug}/apply`}>
            {t("marketing.pages.marketplace-gigs-detail.cta.apply")}
          </Button>
          <Button href="/signup" variant="ghost">
            {t("marketing.pages.marketplace-gigs-detail.cta.needAccount")}
          </Button>
          <span className="text-xs text-[var(--text-secondary)]">
            {r.applicant_count} {t("marketing.pages.marketplace-gigs-detail.cta.applicants")}
          </span>
        </div>
      </section>
    </>
  );
}
