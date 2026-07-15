import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { formatFeeRange } from "@/lib/marketplace";
import { JobsView, type Gig } from "./JobsView";

export const dynamic = "force-dynamic";

/**
 * /m/jobs — open roles across the org's job board, formatted for thumb reach.
 * Reads published `job_postings`, dedupes against the caller's own
 * `job_applications` (so already-applied gigs render the "Applied" pill), and
 * hands plain rows to the surviving client `JobsView`. Apply routes through
 * `applyToJob`. Design truth: prototype jobs tab (app.jsx 2236-2283).
 */

const EMPLOYMENT_LABEL: Record<string, string> = {
  w2: "W-2",
  "1099": "1099",
  volunteer: "Volunteer",
  contract: "Contract",
};

export default async function MobileJobsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div className="screen screen-anim">
        <div className="scr-eye">{t("m.gigs.eyebrow", undefined, "Marketplace")}</div>
        <h1 className="scr-h">{t("m.gigs.title", undefined, "Jobs")}</h1>
        <p className="form-intro">{t("common.configureSupabase", undefined, "Configure Supabase.")}</p>
      </div>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();

  const [{ data: postings }, { data: applications }] = await Promise.all([
    supabase
      .from("job_postings")
      .select(
        "id, title, employment_type, role_taxonomy, certs_required, region, city, day_rate_min_cents, day_rate_max_cents, currency, applicant_count, published_at, created_at",
      )
      .eq("org_id", session.orgId)
      .eq("job_posting_phase", "published")
      .is("deleted_at", null)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(60),
    supabase
      .from("job_applications")
      .select("job_posting_id")
      .eq("applicant_user_id", session.userId),
  ]);

  type PostingRow = {
    id: string;
    title: string;
    employment_type: string;
    role_taxonomy: string[];
    certs_required: string[];
    region: string | null;
    city: string | null;
    day_rate_min_cents: number | null;
    day_rate_max_cents: number | null;
    currency: string;
    applicant_count: number;
  };

  const appliedSet = new Set(
    ((applications ?? []) as Array<{ job_posting_id: string }>).map((a) => a.job_posting_id),
  );

  const gigs: Gig[] = ((postings ?? []) as PostingRow[]).map((p) => {
    const place = [p.city, p.region].filter(Boolean).join(", ");
    return {
      id: p.id,
      role: p.title,
      org: place || t("m.gigs.network", undefined, "Network"),
      logo: (p.title.trim()[0] ?? "G").toUpperCase(),
      rate:
        p.day_rate_min_cents != null || p.day_rate_max_cents != null
          ? t(
              "m.gigs.perDay",
              { rate: formatFeeRange(p.day_rate_min_cents, p.day_rate_max_cents, p.currency) },
              `${formatFeeRange(p.day_rate_min_cents, p.day_rate_max_cents, p.currency)}/day`,
            )
          : t("m.gigs.rateTbd", undefined, "Rate TBD"),
      when: t("m.gigs.openNow", undefined, "Open now"),
      certs: (p.certs_required ?? []).slice(0, 3),
      tags: (p.role_taxonomy ?? []).slice(0, 3),
      employmentType: EMPLOYMENT_LABEL[p.employment_type] ?? p.employment_type,
      applicants: p.applicant_count ?? 0,
      applied: appliedSet.has(p.id),
    };
  });

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">
        {t("m.gigs.eyebrow", { count: gigs.length }, `${gigs.length} Open Roles`)}
      </div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.gigs.title", undefined, "Jobs")}
      </h1>
      <JobsView gigs={gigs} />
    </div>
  );
}
