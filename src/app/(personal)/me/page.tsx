import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { Badge } from "@/components/ui/Badge";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { urlFor } from "@/lib/urls";

export const dynamic = "force-dynamic";

/**
 * `/me` is the universal applicant + member dashboard. The card layout
 * adapts to the session role:
 *   - manager+ (operator personas) lead with "Open console"; the
 *     marketplace cards still appear for use as a contributor.
 *   - member-only (marketplace-only) personas land here directly from
 *     /auth/resolve and see the marketplace stack first.
 *
 * Each card is annotated with a live count where it's cheap to surface.
 */
export default async function MePage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div>
        <h1>{t("me.dashboard.title", undefined, "My Dashboard")}</h1>
        <p className="mt-2 text-sm text-[var(--p-text-2)]">
          {t("me.dashboard.configureSupabase", undefined, "Configure Supabase to sign in.")}
        </p>
      </div>
    );
  }

  const session = await requireSession();
  const isManagerPlus = session.role === "owner" || session.role === "admin" || session.role === "manager";

  // Live counts: applications + offers + my talent profile presence. Each is
  // an inexpensive single-org query — RLS limits to the session's user_id /
  // talent_profile recipients automatically.
  const supabase = await createClient();
  // Head-only exact counts (P2 unbounded-select remediation): these tiles
  // only need cardinalities, so no row payload crosses the wire and the
  // counts stay exact at any scale (the old shape selected every row).
  const [userResp, appsResp, talentResp, offersResp, slotsResp] = await Promise.all([
    supabase.from("users").select("name").eq("id", session.userId).maybeSingle(),
    supabase
      .from("job_applications")
      .select("id", { count: "exact", head: true })
      .eq("applicant_user_id", session.userId)
      .neq("job_application_state", "withdrawn"),
    supabase
      .from("talent_profiles")
      .select("id, is_public")
      .eq("user_id", session.userId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("open_call_submissions")
      .select("id", { count: "exact", head: true })
      .eq("submitter_user_id", session.userId)
      .neq("submission_state", "withdrawn"),
    supabase
      .from("availability_slots")
      .select("id", { count: "exact", head: true })
      .eq("user_id", session.userId),
  ]);
  const appCount = appsResp.count ?? 0;
  const submissionCount = offersResp.count ?? 0;
  const slotCount = slotsResp.count ?? 0;
  const talent = ((talentResp.data ?? []) as Array<{ is_public: boolean }>)[0] ?? null;
  // C-26: lead with the person's name; the email is a sub-line. Only fall
  // back to the raw email when no display name has been set yet.
  const displayName = (userResp.data as { name: string | null } | null)?.name?.trim() || null;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="eyebrow">
            {t("me.dashboard.eyebrow", undefined, "My dashboard")}
          </div>
          <h1 className="mt-1 truncate">{displayName ?? session.email}</h1>
          {displayName && (
            <p className="mt-0.5 truncate font-mono text-xs text-[var(--p-text-2)]">{session.email}</p>
          )}
        </div>
        <form action="/auth/signout" method="post">
          <button className="ps-btn ps-btn--ghost text-xs" type="submit">
            {t("common.signOut", undefined, "Sign Out")}
          </button>
        </form>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="surface-raised p-4">
          <div className="eyebrow">
            {t("me.dashboard.role", undefined, "Role")}
          </div>
          <div className="mt-2">
            <Badge variant="info">{toTitle(session.role)}</Badge>
          </div>
        </div>
        <div className="surface-raised p-4">
          <div className="eyebrow">
            {t("me.dashboard.tier", undefined, "Tier")}
          </div>
          <div className="mt-2">
            <Badge variant="cyan">{toTitle(session.tier)}</Badge>
          </div>
        </div>
        <div className="surface-raised p-4">
          <div className="eyebrow">
            {t("me.dashboard.organization", undefined, "Organization")}
          </div>
          <div className="text-mono mt-2 text-xs">
            {session.orgSlug || session.orgId || t("me.dashboard.noOrg", undefined, "None")}
          </div>
        </div>
      </div>

      {isManagerPlus && (
        <div className="mt-8">
          <Link href={urlFor("platform")} className="surface-raised flex items-center justify-between p-6">
            <div>
              <div className="eyebrow eyebrow-accent">
                {t("me.dashboard.openConsole", undefined, "Open console →")}
              </div>
              <p className="mt-2 text-sm text-[var(--p-text-2)]">
                {t("me.dashboard.consoleBlurb", undefined, "Projects, finance, procurement, production, people, AI.")}
              </p>
            </div>
            <Badge variant="info">{toTitle(session.role)}</Badge>
          </Link>
        </div>
      )}

      <h2 className="eyebrow mt-10 mb-3">
        {t("me.dashboard.marketplaceHeading", undefined, "Marketplace")}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MeCard
          href="/me/applications"
          label={t("me.cards.applications.label", undefined, "My Applications")}
          blurb={t("me.cards.applications.blurb", undefined, "Job applications you've submitted.")}
          count={appCount}
        />
        <MeCard
          href="/me/submissions"
          label={t("me.cards.submissions.label", undefined, "My Submissions")}
          blurb={t("me.cards.submissions.blurb", undefined, "Open-call submissions to casting + RFP.")}
          count={submissionCount}
        />
        <MeCard
          href="/me/availability"
          label={t("me.cards.availability.label", undefined, "Availability")}
          blurb={t("me.cards.availability.blurb", undefined, "Holds, confirms, blocks. Drives booking fit.")}
          count={slotCount}
        />
        <MeCard
          href="/me/talent"
          label={t("me.cards.talent.label", undefined, "Talent EPK")}
          blurb={
            talent
              ? talent.is_public
                ? t("me.cards.talent.blurbLive", undefined, "Public profile live.")
                : t("me.cards.talent.blurbDraft", undefined, "Profile in draft.")
              : t("me.cards.talent.blurbNew", undefined, "Create your EPK.")
          }
          badge={talent ? (talent.is_public ? "live" : "draft") : "new"}
        />
        <MeCard
          href="/me/offers"
          label={t("me.cards.offers.label", undefined, "Booking Offers")}
          blurb={t("me.cards.offers.blurb", undefined, "Offers addressed to acts you're attached to.")}
        />
        <MeCard
          href="/me/reviews"
          label={t("me.cards.reviews.label", undefined, "My Reviews")}
          blurb={t("me.cards.reviews.blurbPlain", undefined, "Reviews go live once both sides have posted.")}
        />
      </div>

      <h2 className="eyebrow mt-10 mb-3">
        {t("me.dashboard.accountHeading", undefined, "Account")}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MeCard
          href="/me/profile"
          label={t("me.cards.profile.label", undefined, "Profile")}
          blurb={t("me.cards.profile.blurb", undefined, "Identity, avatar, contact.")}
        />
        <MeCard
          href="/me/notifications"
          label={t("me.cards.notifications.label", undefined, "Notifications")}
          blurb={t("me.cards.notifications.blurb", undefined, "Channel + push preferences.")}
        />
        <MeCard
          href="/me/security"
          label={t("me.cards.security.label", undefined, "Security")}
          blurb={t("me.cards.security.blurb", undefined, "Password, 2FA, sessions, tokens.")}
        />
        <MeCard
          href="/me/organizations"
          label={t("me.cards.organizations.label", undefined, "Organizations")}
          blurb={t("me.cards.organizations.blurb", undefined, "Memberships and switcher.")}
        />
        <MeCard
          href="/me/tickets"
          label={t("me.cards.tickets.label", undefined, "My Tickets")}
          blurb={t("me.cards.tickets.blurb", undefined, "Purchased and scanned tickets.")}
        />
        <MeCard
          href="/me/settings"
          label={t("me.cards.settings.label", undefined, "Settings")}
          blurb={t("me.cards.settings.blurb", undefined, "Preferences, timezone, locale.")}
        />
      </div>
    </div>
  );
}

function MeCard({
  href,
  label,
  blurb,
  count,
  badge,
}: {
  href: string;
  label: string;
  blurb: string;
  count?: number;
  badge?: string;
}) {
  return (
    <Link href={href} className="surface-raised flex flex-col gap-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold text-[var(--p-accent-text)]">{label} →</span>
        {typeof count === "number" && <Badge variant="muted">{count}</Badge>}
        {badge && (
          <Badge variant={badge === "live" ? "success" : badge === "draft" ? "warning" : "muted"}>{badge}</Badge>
        )}
      </div>
      <p className="text-xs text-[var(--p-text-2)]">{blurb}</p>
    </Link>
  );
}
