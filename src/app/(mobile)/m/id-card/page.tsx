import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

type CrewRow = {
  id: string;
  full_name: string | null;
  role: string | null;
  phone: string | null;
  skills: string[] | null;
};

type CredentialRow = {
  id: string;
  kind: string;
  label: string | null;
  expires_at: string | null;
  status: string | null;
};

type BadgeAwardRow = {
  id: string;
  badge: { name: string; icon: string | null } | null;
};

type OrgRow = {
  name: string;
  slug: string | null;
};

function isExpiringSoon(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}

export default async function IdCardPage() {
  if (!hasSupabase) {
    return (
      <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">Configure Supabase.</div>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const [crewRes, credRes, badgeRes, orgRes] = await Promise.all([
    supabase
      .from("crew_members")
      .select("id, full_name, role, phone, skills")
      .eq("org_id", session.orgId)
      .eq("email", session.email ?? "")
      .is("deleted_at", null)
      .maybeSingle(),

    supabase
      .from("credentials")
      .select("id, kind, label, expires_at, status")
      .eq("org_id", session.orgId)
      .eq("user_id", session.userId)
      .order("expires_at", { ascending: true })
      .limit(20),

    supabase
      .from("badge_awards")
      .select("id, badge:badge_id(name, icon)")
      .eq("user_id", session.userId)
      .order("awarded_at", { ascending: false })
      .limit(10),

    supabase
      .from("orgs")
      .select("name, slug")
      .eq("id", session.orgId)
      .maybeSingle(),
  ]);

  const crew = crewRes.data as CrewRow | null;
  const credentials = (credRes.data ?? []) as CredentialRow[];
  const badges = (badgeRes.data ?? []) as BadgeAwardRow[];
  const org = orgRes.data as OrgRow | null;

  const displayName = crew?.full_name ?? session.email ?? "Crew Member";
  const displayRole = crew?.role ?? "Team Member";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // QR data encodes a verifiable URL to the org's accreditation verification endpoint
  const qrPayload = `https://lytehaus.live/verify?uid=${session.userId}&org=${session.orgId}`;

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">COMPVSS</div>
      <h1 className="mt-1 mb-5 text-2xl font-semibold">My ID Card</h1>

      {/* Card */}
      <div
        className="relative overflow-hidden rounded-2xl p-6"
        style={{
          background: "linear-gradient(135deg, var(--org-primary) 0%, color-mix(in srgb, var(--org-primary) 60%, #000) 100%)",
          color: "#fff",
          minHeight: 220,
        }}
      >
        {/* Org watermark */}
        <div
          className="pointer-events-none absolute right-4 top-4 font-semibold tracking-[0.3em] opacity-10 select-none"
          style={{ fontSize: "clamp(10px, 3vw, 14px)" }}
          aria-hidden
        >
          L Y T E H A U S
        </div>

        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div
            className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full text-xl font-bold"
            style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)" }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-lg font-semibold leading-tight">{displayName}</div>
            <div className="mt-0.5 text-sm opacity-80">{displayRole}</div>
            {org && <div className="mt-1 text-xs font-medium tracking-wide opacity-60">{org.name}</div>}
            <div className="mt-2 font-mono text-xs opacity-50">{session.userId.slice(0, 8).toUpperCase()}</div>
          </div>
        </div>

        {/* QR placeholder — real QR needs a client component; show the raw URL for now */}
        <div
          className="mt-5 flex items-center gap-3 rounded-xl p-3"
          style={{ background: "rgba(255,255,255,0.12)" }}
        >
          <div
            className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-white font-mono text-[8px] text-black"
            aria-label="QR code placeholder"
          >
            QR
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold opacity-90">Scan to verify</div>
            <div className="mt-0.5 break-all font-mono text-[10px] opacity-50">{qrPayload}</div>
          </div>
        </div>
      </div>

      {/* Credentials */}
      {credentials.length > 0 && (
        <section className="mt-5">
          <h2 className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">Credentials</h2>
          <ul className="mt-2 space-y-2">
            {credentials.map((c) => {
              const expired = isExpired(c.expires_at);
              const expiring = isExpiringSoon(c.expires_at);
              return (
                <li key={c.id} className="surface flex items-center justify-between p-3">
                  <div>
                    <div className="text-sm font-medium">{c.label ?? c.kind}</div>
                    {c.expires_at && (
                      <div
                        className="mt-0.5 font-mono text-xs"
                        style={{ color: expired ? "var(--color-error,#ef4444)" : expiring ? "var(--color-warning,#f59e0b)" : "var(--text-muted)" }}
                      >
                        {expired ? "Expired " : expiring ? "Expires " : "Valid to "}
                        {new Date(c.expires_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <Badge
                    variant={expired ? "error" : expiring ? "warning" : c.status === "active" ? "success" : "muted"}
                  >
                    {expired ? "expired" : expiring ? "expiring" : (c.status ?? "—")}
                  </Badge>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Badges */}
      {badges.length > 0 && (
        <section className="mt-5">
          <h2 className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">Earned Badges</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {(badges as BadgeAwardRow[]).map((ba) => (
              <li key={ba.id} className="surface flex items-center gap-2 px-3 py-2 text-xs">
                <span className="font-mono text-base">{ba.badge?.icon ?? "🏅"}</span>
                <span className="font-medium">{ba.badge?.name ?? "Badge"}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {crew?.skills && crew.skills.length > 0 && (
        <section className="mt-5">
          <h2 className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">Skills</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {crew.skills.map((s) => (
              <Badge key={s} variant="info">{s}</Badge>
            ))}
          </div>
        </section>
      )}

      <p className="mt-6 text-center font-mono text-xs text-[var(--text-muted)]">
        LYTEHAUS Technologies · COMPVSS · {new Date().getFullYear()}
      </p>
    </div>
  );
}
