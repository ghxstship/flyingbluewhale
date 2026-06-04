import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Member = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  kind: string;
  venue_id: string | null;
  created_at: string;
};

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t } = await getRequestT();
  const STATUS_LABEL: Record<string, string> = {
    pending: t("p.volunteer.application.status.pending", undefined, "Application received"),
    in_review: t("p.volunteer.application.status.in_review", undefined, "Under review"),
    approved: t("p.volunteer.application.status.approved", undefined, "Approved — onboarding"),
    active: t("p.volunteer.application.status.active", undefined, "Active volunteer"),
    declined: t("p.volunteer.application.status.declined", undefined, "Declined"),
  };
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("p.volunteer.application.eyebrowShort", undefined, "Portal")}
          title={t("p.volunteer.application.titleFull", undefined, "Volunteer Application")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("p.volunteer.application.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const fmtDate = (iso: string): string => fmt.dateParts(iso, { month: "short", day: "numeric", year: "numeric" });
  const { data } = await supabase
    .from("workforce_members")
    .select("id, full_name, email, phone, role, kind, venue_id, created_at")
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId)
    .eq("kind", "volunteer")
    .maybeSingle();

  const member = data as Member | null;
  const status = member ? "active" : "pending";

  return (
    <>
      <ModuleHeader
        eyebrow={t("p.volunteer.application.eyebrow", undefined, "Portal · Volunteer")}
        title={t("p.volunteer.application.title", undefined, "Application")}
        subtitle={STATUS_LABEL[status]}
        breadcrumbs={[
          { label: t("p.volunteer.application.breadcrumb.portal", undefined, "Portal"), href: `/p/${slug}` },
          {
            label: t("p.volunteer.application.breadcrumb.volunteer", undefined, "Volunteer"),
            href: `/p/${slug}/volunteer`,
          },
          { label: t("p.volunteer.application.breadcrumb.application", undefined, "Application") },
        ]}
        action={<Badge variant={member ? "success" : "warning"}>{status}</Badge>}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("p.volunteer.application.metric.status", undefined, "Status")}
            value={STATUS_LABEL[status]}
            accent={Boolean(member)}
          />
          <MetricCard
            label={t("p.volunteer.application.metric.role", undefined, "Role")}
            value={member?.role ?? t("p.volunteer.application.tbd", undefined, "TBD")}
          />
          <MetricCard
            label={t("p.volunteer.application.metric.joined", undefined, "Joined")}
            value={member ? fmtDate(member.created_at) : "—"}
          />
        </div>

        {member ? (
          <section className="surface p-5">
            <h3 className="text-sm font-semibold">
              {t("p.volunteer.application.profile.title", undefined, "Your Profile")}
            </h3>
            <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-[var(--text-muted)]">
                {t("p.volunteer.application.profile.name", undefined, "Name")}
              </dt>
              <dd>{member.full_name}</dd>
              <dt className="text-[var(--text-muted)]">
                {t("p.volunteer.application.profile.email", undefined, "Email")}
              </dt>
              <dd className="font-mono text-xs">{member.email ?? "—"}</dd>
              <dt className="text-[var(--text-muted)]">
                {t("p.volunteer.application.profile.phone", undefined, "Phone")}
              </dt>
              <dd className="font-mono text-xs">{member.phone ?? "—"}</dd>
              <dt className="text-[var(--text-muted)]">
                {t("p.volunteer.application.profile.role", undefined, "Role")}
              </dt>
              <dd>{member.role ?? t("p.volunteer.application.tbd", undefined, "TBD")}</dd>
            </dl>
            <p className="mt-4 text-xs text-[var(--text-muted)]">
              {t("p.volunteer.application.profile.updatePrompt", undefined, "Need to update your details? Email")}{" "}
              <a className="text-[var(--org-primary)]" href="mailto:volunteers@atlvs.pro">
                volunteers@atlvs.pro
              </a>
              .
            </p>
          </section>
        ) : (
          <section className="surface p-5">
            <h3 className="text-sm font-semibold">
              {t("p.volunteer.application.submit.title", undefined, "Submit Your Application")}
            </h3>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              {t(
                "p.volunteer.application.submit.description",
                undefined,
                "We're recruiting volunteers for the upcoming event window. Applications take ~10 minutes — you'll need your contact details, availability, and any relevant skills.",
              )}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`mailto:volunteers@atlvs.pro?subject=Volunteer%20application%20—%20${slug}`}
                className="btn btn-primary btn-sm"
              >
                {t("p.volunteer.application.submit.emailCta", undefined, "Email volunteer team")}
              </Link>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
