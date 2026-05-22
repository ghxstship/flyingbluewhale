import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

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
  if (!hasSupabase) {
    return (
      <div>
        <h1 className="text-display text-3xl">My Dashboard</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Configure Supabase to sign in.</p>
      </div>
    );
  }

  const session = await requireSession();
  const isManagerPlus = session.role === "owner" || session.role === "admin" || session.role === "manager";

  // Live counts: applications + offers + my talent profile presence. Each is
  // an inexpensive single-org query — RLS limits to the session's user_id /
  // talent_profile recipients automatically.
  const supabase = await createClient();
  const [appsResp, talentResp, offersResp, slotsResp] = await Promise.all([
    supabase.from("job_applications").select("id, status").eq("applicant_user_id", session.userId),
    supabase
      .from("talent_profiles")
      .select("id, is_public")
      .eq("user_id", session.userId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase.from("open_call_submissions").select("id, status").eq("submitter_user_id", session.userId),
    supabase.from("availability_slots").select("id, kind").eq("user_id", session.userId),
  ]);
  const appCount = ((appsResp.data ?? []) as Array<{ status: string }>).filter((r) => r.status !== "withdrawn").length;
  const submissionCount = ((offersResp.data ?? []) as Array<{ status: string }>).filter(
    (r) => r.status !== "withdrawn",
  ).length;
  const slotCount = (slotsResp.data ?? []).length;
  const talent = ((talentResp.data ?? []) as Array<{ is_public: boolean }>)[0] ?? null;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-label text-[var(--color-text-tertiary)]">My dashboard</div>
          <h1 className="text-display mt-1 text-3xl">{session.email}</h1>
        </div>
        <form action="/auth/signout" method="post">
          <Button type="submit" variant="ghost" size="sm">
            Sign Out
          </Button>
        </form>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="card-elevated p-4">
          <div className="text-label text-[var(--color-text-tertiary)]">Role</div>
          <div className="mt-2">
            <Badge variant="info">{session.role}</Badge>
          </div>
        </div>
        <div className="card-elevated p-4">
          <div className="text-label text-[var(--color-text-tertiary)]">Tier</div>
          <div className="mt-2">
            <Badge variant="cyan">{session.tier}</Badge>
          </div>
        </div>
        <div className="card-elevated p-4">
          <div className="text-label text-[var(--color-text-tertiary)]">Organization</div>
          <div className="text-mono mt-2 text-xs">{session.orgSlug || session.orgId || "None"}</div>
        </div>
      </div>

      {isManagerPlus && (
        <div className="mt-8">
          <Link href="/console" className="card flex items-center justify-between p-6">
            <div>
              <div className="text-label text-[var(--brand-color)]">Open console →</div>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                Projects, finance, procurement, production, people, AI.
              </p>
            </div>
            <Badge variant="info">{session.role}</Badge>
          </Link>
        </div>
      )}

      <h2 className="text-label mt-10 mb-3 text-[var(--color-text-tertiary)]">Marketplace</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MeCard
          href="/me/applications"
          label="My Applications"
          blurb="Job applications you've submitted."
          count={appCount}
        />
        <MeCard
          href="/me/submissions"
          label="My Submissions"
          blurb="Open-call submissions to casting + RFP."
          count={submissionCount}
        />
        <MeCard
          href="/me/availability"
          label="Availability"
          blurb="Holds, confirms, blocks. Drives booking fit."
          count={slotCount}
        />
        <MeCard
          href="/me/talent"
          label="Talent EPK"
          blurb={talent ? (talent.is_public ? "Public profile live." : "Profile in draft.") : "Create your EPK."}
          badge={talent ? (talent.is_public ? "live" : "draft") : "new"}
        />
        <MeCard href="/me/offers" label="Booking Offers" blurb="Offers addressed to acts you're attached to." />
        <MeCard
          href="/me/reviews"
          label="My Reviews"
          blurb="Bidirectional reviews — released after counterpart posts."
        />
      </div>

      <h2 className="text-label mt-10 mb-3 text-[var(--color-text-tertiary)]">Account</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MeCard href="/me/profile" label="Profile" blurb="Identity, avatar, contact." />
        <MeCard href="/me/notifications" label="Notifications" blurb="Channel + push preferences." />
        <MeCard href="/me/security" label="Security" blurb="Password, 2FA, sessions, tokens." />
        <MeCard href="/me/organizations" label="Organizations" blurb="Memberships and switcher." />
        <MeCard href="/me/tickets" label="My Tickets" blurb="Purchased and scanned tickets." />
        <MeCard href="/me/settings" label="Settings" blurb="Preferences, timezone, locale." />
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
    <Link href={href} className="card-elevated flex flex-col gap-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold text-[var(--brand-color)]">{label} →</span>
        {typeof count === "number" && <Badge variant="muted">{count}</Badge>}
        {badge && (
          <Badge variant={badge === "live" ? "success" : badge === "draft" ? "warning" : "muted"}>{badge}</Badge>
        )}
      </div>
      <p className="text-xs text-[var(--color-text-secondary)]">{blurb}</p>
    </Link>
  );
}
