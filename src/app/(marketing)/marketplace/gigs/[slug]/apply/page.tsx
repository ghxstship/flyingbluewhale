import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { formatFeeRange } from "@/lib/marketplace";
import { getRequestT } from "@/lib/i18n/request";
import { applyToGig } from "./actions";

import type { Metadata } from "next";

// E-23: user-specific form surface — explicit noindex.
export const metadata: Metadata = {
  title: "Gig Application",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const INPUT = "ps-input w-full";
const LBL = "text-xs font-medium text-[var(--p-text-2)]";

type Row = {
  id: string;
  public_slug: string;
  title: string;
  day_rate_min_cents: number | null;
  day_rate_max_cents: number | null;
  currency: string;
  org_name: string;
};

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const crumbs = [
    {
      label: t("marketing.pages.marketplace-gigs-apply.breadcrumbs.marketplace", undefined, "Marketplace"),
      href: "/marketplace",
    },
    {
      label: t("marketing.pages.marketplace-gigs-apply.breadcrumbs.crewGigs", undefined, "Crew Gigs"),
      href: "/marketplace/gigs",
    },
  ];

  const { data } = await supabase
    .from("public_job_board")
    // Explicit render-contract columns (HP-13): the local Row type is the
    // page's exact contract — a future column added to the public view must
    // be opted into here rather than flowing to anonymous visitors silently.
    .select("id, public_slug, title, day_rate_min_cents, day_rate_max_cents, currency, org_name")
    .eq("public_slug", slug)
    .maybeSingle();
  if (!data) {
    return (
      <>
        <Breadcrumbs
          items={[
            ...crumbs,
            { label: t("marketing.pages.marketplace-gigs-apply.breadcrumbs.apply", undefined, "Apply") },
          ]}
          className="mx-auto max-w-2xl px-6 pt-6"
        />
        <section className="mx-auto max-w-2xl px-6 pt-8 pb-16">
          <h1 className="hed-2xl">
            {t("marketing.pages.marketplace-gigs-apply.closed.title", undefined, "This Gig Is Closed")}
          </h1>
          <p className="mt-3 text-sm text-[var(--p-text-2)]">
            {t(
              "marketing.pages.marketplace-gigs-apply.closed.body",
              undefined,
              "This posting is no longer accepting applications. It may have expired or been filled.",
            )}
          </p>
          <div className="mt-6">
            <Button href="/marketplace/gigs">
              {t("marketing.pages.marketplace-gigs-apply.closed.cta", undefined, "Browse Open Gigs")}
            </Button>
          </div>
        </section>
      </>
    );
  }
  const r = data as Row;

  const { data: existing } = await supabase
    .from("job_applications")
    .select("id")
    .eq("job_posting_id", r.id)
    .eq("applicant_user_id", session.userId)
    .neq("job_application_state", "withdrawn")
    .maybeSingle();
  if (existing) {
    return (
      <>
        <Breadcrumbs
          items={[
            ...crumbs,
            { label: r.title, href: `/marketplace/gigs/${r.public_slug}` },
            { label: t("marketing.pages.marketplace-gigs-apply.breadcrumbs.apply", undefined, "Apply") },
          ]}
          className="mx-auto max-w-2xl px-6 pt-6"
        />
        <section className="mx-auto max-w-2xl px-6 pt-8 pb-16">
          <h1 className="hed-2xl">
            {t("marketing.pages.marketplace-gigs-apply.already.title", undefined, "Already Applied")}
          </h1>
          <p className="mt-3 text-sm text-[var(--p-text-2)]">
            {t(
              "marketing.pages.marketplace-gigs-apply.already.body",
              undefined,
              "You've already applied to this gig. Stage updates land in your applications as the operator works their pipeline.",
            )}
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Button href="/me/applications">
              {t("marketing.pages.marketplace-gigs-apply.already.cta", undefined, "View My Applications")}
            </Button>
            <Button href="/marketplace/gigs" variant="ghost">
              {t("marketing.pages.marketplace-gigs-apply.already.browse", undefined, "Browse More Gigs")}
            </Button>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Breadcrumbs
        items={[
          ...crumbs,
          { label: r.title, href: `/marketplace/gigs/${r.public_slug}` },
          { label: t("marketing.pages.marketplace-gigs-apply.breadcrumbs.apply", undefined, "Apply") },
        ]}
        className="mx-auto max-w-2xl px-6 pt-6"
      />

      <section className="mx-auto max-w-2xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">
          {t("marketing.pages.marketplace-gigs-apply.hero.eyebrow", undefined, "Apply")} · {r.org_name}
        </div>
        <h1 className="hed-2xl mt-4">{r.title}</h1>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="info">
            {formatFeeRange(r.day_rate_min_cents, r.day_rate_max_cents, r.currency)}
            {t("marketing.pages.marketplace-gigs-apply.hero.perDay", undefined, " / day")}
          </Badge>
        </div>

        <div className="surface mt-8 p-6">
          <FormShell
            action={applyToGig.bind(null, r.public_slug)}
            cancelHref={`/marketplace/gigs/${r.public_slug}`}
            submitLabel={t("marketing.pages.marketplace-gigs-apply.form.submit", undefined, "Submit Application")}
          >
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("marketing.pages.marketplace-gigs-apply.form.coverNote", undefined, "Cover Note")}
                <span className="ms-0.5 text-[var(--p-danger)]">*</span>
              </span>
              <textarea
                name="cover_note"
                required
                rows={6}
                minLength={10}
                maxLength={4000}
                placeholder={t(
                  "marketing.pages.marketplace-gigs-apply.form.coverNotePlaceholder",
                  undefined,
                  "Relevant credits, availability, and why you're the right hire for this run.",
                )}
                className={INPUT}
              />
            </label>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>
                  {t("marketing.pages.marketplace-gigs-apply.form.portfolioUrl", undefined, "Portfolio URL")}
                </span>
                <input
                  type="url"
                  name="portfolio_url"
                  maxLength={400}
                  placeholder="https://yourportfolio.com"
                  className={`${INPUT} font-mono`}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>
                  {t("marketing.pages.marketplace-gigs-apply.form.phone", undefined, "Phone")}
                </span>
                <input type="tel" name="phone" maxLength={40} placeholder="+1 305 555 0100" className={INPUT} />
              </label>
            </div>
          </FormShell>
        </div>
      </section>
    </>
  );
}
