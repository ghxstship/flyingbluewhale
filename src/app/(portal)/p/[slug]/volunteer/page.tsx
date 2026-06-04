import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("p.volunteer.eyebrow", undefined, "Portal")}
          title={t("p.volunteer.title", undefined, "Volunteer")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("p.volunteer.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const [{ data: meRows }] = await Promise.all([
    supabase
      .from("workforce_members")
      .select("id, full_name, role, kind, venue_id")
      .eq("org_id", session.orgId)
      .eq("user_id", session.userId)
      .eq("kind", "volunteer")
      .limit(1),
  ]);

  const me = (meRows ?? [])[0] as
    | { id: string; full_name: string; role: string | null; venue_id: string | null }
    | undefined;
  let upcomingShifts = 0;
  if (me) {
    const { count } = await supabase
      .from("shifts")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .eq("workforce_member_id", me.id)
      .gte("starts_at", new Date().toISOString());
    upcomingShifts = count ?? 0;
  }

  const tiles = [
    {
      href: `/p/${slug}/volunteer/application`,
      label: t("p.volunteer.tiles.application.label", undefined, "Application"),
      desc: t("p.volunteer.tiles.application.desc", undefined, "Status of your volunteer application"),
    },
    {
      href: `/p/${slug}/volunteer/schedule`,
      label: t("p.volunteer.tiles.schedule.label", undefined, "Schedule"),
      desc: t("p.volunteer.tiles.schedule.desc", undefined, "Your upcoming shifts"),
    },
    {
      href: `/p/${slug}/volunteer/training`,
      label: t("p.volunteer.tiles.training.label", undefined, "Training"),
      desc: t("p.volunteer.tiles.training.desc", undefined, "Required modules and certificates"),
    },
    {
      href: `/p/${slug}/volunteer/uniform`,
      label: t("p.volunteer.tiles.uniform.label", undefined, "Uniform"),
      desc: t("p.volunteer.tiles.uniform.desc", undefined, "Pickup details and sizing"),
    },
  ];

  return (
    <>
      <ModuleHeader
        eyebrow={t("p.volunteer.eyebrow", undefined, "Portal")}
        title={t("p.volunteer.title", undefined, "Volunteer")}
        subtitle={
          me
            ? t(
                "p.volunteer.subtitle.welcome",
                { name: me.full_name, role: me.role ? ` · ${me.role}` : "" },
                `Welcome, ${me.full_name}${me.role ? ` · ${me.role}` : ""}`,
              )
            : t("p.volunteer.subtitle.dashboard", undefined, "Volunteer dashboard")
        }
        breadcrumbs={[
          { label: t("p.volunteer.breadcrumbs.portal", undefined, "Portal"), href: `/p/${slug}` },
          { label: t("p.volunteer.breadcrumbs.volunteer", undefined, "Volunteer") },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("p.volunteer.metrics.upcomingShifts", undefined, "Upcoming Shifts")}
            value={fmt.number(upcomingShifts)}
            accent={upcomingShifts > 0}
          />
          <MetricCard
            label={t("p.volunteer.metrics.status", undefined, "Status")}
            value={
              me
                ? t("p.volunteer.metrics.status.active", undefined, "Active")
                : t("p.volunteer.metrics.status.pending", undefined, "Pending")
            }
          />
          <MetricCard label={t("p.volunteer.metrics.role", undefined, "Role")} value={me?.role ?? "—"} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((tile) => (
            <Link key={tile.href} href={tile.href} className="surface hover-lift p-5">
              <div className="text-sm font-semibold">{tile.label}</div>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">{tile.desc}</p>
            </Link>
          ))}
        </div>
        {!me && (
          <div className="surface p-4 text-xs text-[var(--text-muted)]">
            <Badge variant="warning">{t("p.volunteer.notOnboarded.badge", undefined, "Not yet onboarded")}</Badge>{" "}
            {t(
              "p.volunteer.notOnboarded.message",
              undefined,
              "Submit your application via the Application tile to get scheduled.",
            )}
          </div>
        )}
      </div>
    </>
  );
}
