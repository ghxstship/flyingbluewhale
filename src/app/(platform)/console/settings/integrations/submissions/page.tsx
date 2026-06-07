import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Tier = "submitted" | "reviewing" | "verified" | "certified" | "rejected";

type Row = {
  id: string;
  slug: string;
  name: string;
  partner_org_name: string;
  partner_contact_email: string;
  category: string;
  short_description: string;
  certification_tier: Tier;
  published_at: string | null;
  created_at: string;
};

const TIER_TONE: Record<Tier, "muted" | "info" | "success" | "warning" | "error"> = {
  submitted: "muted",
  reviewing: "info",
  verified: "info",
  certified: "success",
  rejected: "error",
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.settings.integrations.submissions.eyebrow", undefined, "Settings · Integrations")}
          title={t("console.settings.integrations.submissions.title", undefined, "Partner Submissions")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.settings.integrations.submissions.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  // Gating: org-scoped session required to view, but the underlying
  // partner_integrations table is global (not org-scoped) by design —
  // submissions are platform-wide. We require auth so anonymous folks
  // can't crawl this; ATLVS internal staff are the intended viewers.
  await requireSession();
  // The admin queue needs to see ALL submissions including submitted/
  // reviewing/rejected rows. The public RLS policy hides those, so we
  // use the service-role client when available. Without it, we fall
  // back to the regular client and surface a banner explaining the
  // limitation — verified/certified+published rows are still visible.
  let supabase: LooseSupabase;
  let serviceRoleAvailable = false;
  try {
    supabase = createServiceClient() as unknown as LooseSupabase;
    serviceRoleAvailable = true;
  } catch {
    const { createClient } = await import("@/lib/supabase/server");
    supabase = (await createClient()) as unknown as LooseSupabase;
  }

  const { data } = await supabase
    .from("partner_integrations")
    .select(
      "id, slug, name, partner_org_name, partner_contact_email, category, short_description, certification_tier, published_at, created_at",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as unknown as Row[];

  const counts: Record<Tier, number> = {
    submitted: 0,
    reviewing: 0,
    verified: 0,
    certified: 0,
    rejected: 0,
  };
  for (const r of rows) counts[r.certification_tier] += 1;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.settings.integrations.submissions.eyebrow", undefined, "Settings · Integrations")}
        title={t("console.settings.integrations.submissions.title", undefined, "Partner Submissions")}
        subtitle={
          rows.length === 1
            ? t(
                "console.settings.integrations.submissions.subtitleOne",
                { inQueue: counts.submitted + counts.reviewing, live: counts.verified + counts.certified },
                `1 Submission · ${counts.submitted + counts.reviewing} In Queue · ${counts.verified + counts.certified} Live`,
              )
            : t(
                "console.settings.integrations.submissions.subtitleOther",
                {
                  count: rows.length,
                  inQueue: counts.submitted + counts.reviewing,
                  live: counts.verified + counts.certified,
                },
                `${rows.length} Submissions · ${counts.submitted + counts.reviewing} In Queue · ${counts.verified + counts.certified} Live`,
              )
        }
      />
      <div className="page-content space-y-5">
        {!serviceRoleAvailable ? (
          <div className="surface border-s-4 border-s-amber-500 p-4 text-xs text-[var(--p-text-2)]">
            <strong className="text-[var(--p-text-1)]">
              {t("console.settings.integrations.submissions.limitedView", undefined, "Limited view:")}
            </strong>{" "}
            <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
            {t(
              "console.settings.integrations.submissions.limitedViewBody",
              undefined,
              "is not configured. Showing only published verified/certified submissions. Set the env var to see the full review queue (submitted, reviewing, rejected).",
            )}
          </div>
        ) : null}
        <div className="metric-grid-4">
          <MetricCard
            label={t("console.settings.integrations.submissions.metric.inQueue", undefined, "In queue")}
            value={counts.submitted + counts.reviewing}
            accent
          />
          <MetricCard
            label={t("console.settings.integrations.submissions.metric.verified", undefined, "Verified")}
            value={counts.verified}
          />
          <MetricCard
            label={t("console.settings.integrations.submissions.metric.certified", undefined, "Certified")}
            value={counts.certified}
          />
          <MetricCard
            label={t("console.settings.integrations.submissions.metric.rejected", undefined, "Rejected")}
            value={counts.rejected}
          />
        </div>
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/settings/integrations/submissions/${r.id}`}
          emptyLabel={t(
            "console.settings.integrations.submissions.emptyLabel",
            undefined,
            "No partner submissions yet",
          )}
          emptyDescription={t(
            "console.settings.integrations.submissions.emptyDescription",
            undefined,
            "Partners submit proposals at /integrations/submit. Each lands here for tech review → Verified → Certified.",
          )}
          columns={[
            {
              key: "name",
              header: t("console.settings.integrations.submissions.col.integration", undefined, "Integration"),
              render: (r) => <span className="font-medium">{r.name}</span>,
            },
            {
              key: "partner_org_name",
              header: t("console.settings.integrations.submissions.col.partner", undefined, "Partner"),
              render: (r) => r.partner_org_name,
            },
            {
              key: "category",
              header: t("console.settings.integrations.submissions.col.category", undefined, "Category"),
              render: (r) => toTitle(r.category),
            },
            {
              key: "tier",
              header: t("console.settings.integrations.submissions.col.tier", undefined, "Tier"),
              render: (r) => <Badge variant={TIER_TONE[r.certification_tier]}>{toTitle(r.certification_tier)}</Badge>,
            },
            {
              key: "live",
              header: t("console.settings.integrations.submissions.col.live", undefined, "Live"),
              render: (r) =>
                r.published_at ? (
                  <Badge variant="success">
                    {t("console.settings.integrations.submissions.liveBadge", undefined, "Live")}
                  </Badge>
                ) : (
                  <span className="text-xs text-[var(--p-text-2)]">—</span>
                ),
            },
            {
              key: "email",
              header: t("console.settings.integrations.submissions.col.contact", undefined, "Contact"),
              render: (r) => <span className="font-mono text-xs">{r.partner_contact_email}</span>,
            },
            {
              key: "submitted",
              header: t("console.settings.integrations.submissions.col.submitted", undefined, "Submitted"),
              render: (r) => new Date(r.created_at).toLocaleDateString(),
            },
          ]}
        />
        <p className="text-xs text-[var(--p-text-2)]">
          {t("console.settings.integrations.submissions.publicDirectoryLabel", undefined, "Public partner directory:")}{" "}
          <Link href="/integrations/partners" className="underline">
            /integrations/partners
          </Link>
          . {t("console.settings.integrations.submissions.submissionFormLabel", undefined, "Submission form:")}{" "}
          <Link href="/integrations/submit" className="underline">
            /integrations/submit
          </Link>
          .
        </p>
      </div>
    </>
  );
}
