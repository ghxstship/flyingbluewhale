import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { isAdmin, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { CAPABILITY_DESCRIPTION, CAPABILITY_LABEL, GRANTABLE_CAPABILITIES } from "@/lib/rbac/capabilities";
import { CapabilitiesClient, type RoleGrantRow, type UserGrantRow } from "./CapabilitiesClient";

/**
 * Capabilities — the administration ADR-0015 was missing.
 *
 * The grant layer shipped fully enforced and completely unadministered:
 * `effective_capabilities` resolves grants into every session, `can()` reads
 * them, and `transitionAssetState` gates crew self-checkout on
 * `asset:custody` — but the two grant tables had ZERO consumers outside the
 * catalog and the generated types. Turning a capability on for a customer
 * meant writing SQL against production.
 *
 * That is why the parity audit's highest-impact gap (G3, crew gear custody)
 * sat "blocked": not for want of a decision, and not for want of a resolver,
 * but because nothing could grant the thing.
 */
export const dynamic = "force-dynamic";

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.settings.capabilities.eyebrow", undefined, "Settings · Team & Access")}
          title={t("console.settings.capabilities.title", undefined, "Capabilities")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.settings.capabilities.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }

  const session = await requireSession();
  const fmt = await getRequestFormatters();

  // Read-only for the manager band and below: seeing which capabilities the
  // org hands out is not sensitive, but handing them out is admin-only — and
  // the RLS agrees (20260715230000_capability_grants_admin_band), so this
  // isn't a UI-only gate.
  const canEdit = isAdmin(session);
  const supabase = await createClient();

  const [rolesRes, roleGrantsRes, userGrantsRes, orgRes, membersRes] = await Promise.all([
    supabase
      .from("crew_roles")
      .select("id, name, slug")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("name"),
    supabase
      .from("role_capability_grants")
      .select("id, capability, shift_derivable, created_at, crew_role_id, crew_roles(name)")
      .eq("org_id", session.orgId)
      .order("created_at", { ascending: false }),
    supabase
      .from("user_capability_grants")
      .select("id, user_id, capability, valid_from, valid_until, reason, revoked_at, created_at")
      .eq("org_id", session.orgId)
      .is("revoked_at", null)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("orgs").select("capability_grants_enforced").eq("id", session.orgId).maybeSingle(),
    supabase
      .from("memberships")
      .select("user_id, users(email)")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .limit(500),
  ]);

  const emailByUser = new Map<string, string>();
  for (const m of (membersRes.data ?? []) as { user_id: string; users: { email?: string } | null }[]) {
    if (m.users?.email) emailByUser.set(m.user_id, m.users.email);
  }

  const roles = ((rolesRes.data ?? []) as { id: string; name: string; slug: string }[]).map((r) => ({
    id: r.id,
    name: r.name,
  }));

  const roleGrants: RoleGrantRow[] = (
    (roleGrantsRes.data ?? []) as {
      id: string;
      capability: string;
      shift_derivable: boolean;
      created_at: string;
      crew_role_id: string;
      crew_roles: { name?: string } | null;
    }[]
  ).map((g) => ({
    id: g.id,
    capability: g.capability,
    roleName: g.crew_roles?.name ?? "(deleted role)",
    shiftDerivable: g.shift_derivable,
    created: fmt.relative(g.created_at),
  }));

  const now = Date.now();
  const userGrants: UserGrantRow[] = (
    (userGrantsRes.data ?? []) as {
      id: string;
      user_id: string;
      capability: string;
      valid_from: string | null;
      valid_until: string | null;
      reason: string | null;
    }[]
  ).map((g) => {
    // A grant row can exist and not be live: outside its window it resolves to
    // nothing. Showing "active" for a lapsed row is how an operator concludes
    // the permission system is broken.
    const from = g.valid_from ? Date.parse(g.valid_from) : null;
    const until = g.valid_until ? Date.parse(g.valid_until) : null;
    const live = (from === null || from <= now) && (until === null || until > now);
    const window =
      from === null && until === null
        ? t("console.settings.capabilities.always", undefined, "No end date")
        : `${from ? fmt.date(g.valid_from as string) : "—"} → ${until ? fmt.date(g.valid_until as string) : "—"}`;
    return {
      id: g.id,
      capability: g.capability,
      email: emailByUser.get(g.user_id) ?? g.user_id,
      window,
      live,
      lapsed: until !== null && until <= now,
      reason: g.reason,
    };
  });

  const enforced = Boolean(
    (orgRes.data as { capability_grants_enforced?: boolean | null } | null)?.capability_grants_enforced,
  );

  const catalog = GRANTABLE_CAPABILITIES.map((c) => ({
    value: c,
    label: CAPABILITY_LABEL[c],
    description: CAPABILITY_DESCRIPTION[c],
  }));

  const members = Array.from(emailByUser.entries())
    .map(([id, email]) => ({ id, email }))
    .sort((a, b) => a.email.localeCompare(b.email));

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.settings.capabilities.eyebrow", undefined, "Settings · Team & Access")}
        title={t("console.settings.capabilities.title", undefined, "Capabilities")}
        subtitle={t(
          "console.settings.capabilities.subtitle",
          undefined,
          "Add-on permissions on top of what a role already has. Grant them to a role, or to one person for a set window.",
        )}
      />
      <div className="page-content space-y-6">
        {!canEdit && (
          <div className="ps-alert ps-alert--info" role="status">
            {t(
              "console.settings.capabilities.readOnly",
              undefined,
              "You can see what this workspace grants. Changing it needs admin access.",
            )}
          </div>
        )}

        {roles.length === 0 && (
          <EmptyState
            size="compact"
            title={t("console.settings.capabilities.noRoles.title", undefined, "No Roles Yet")}
            description={t(
              "console.settings.capabilities.noRoles.body",
              undefined,
              "Capabilities are granted to a role or a person. Add the roles your crew actually work as, then grant from here.",
            )}
          />
        )}

        <CapabilitiesClient
          canEdit={canEdit}
          enforced={enforced}
          catalog={catalog}
          roles={roles}
          members={members}
          roleGrants={roleGrants}
          userGrants={userGrants}
        />

        <div className="surface p-5">
          <h2 className="text-sm font-semibold">
            {t("console.settings.capabilities.reference", undefined, "What Each One Means")}
          </h2>
          <ul className="mt-3 space-y-2">
            {catalog.map((c) => (
              <li key={c.value} className="text-sm">
                <span className="inline-flex items-center gap-2">
                  <Badge variant="muted">{c.label}</Badge>
                  <code className="font-mono text-xs text-[var(--p-text-3)]">{c.value}</code>
                </span>
                <p className="mt-1 text-xs text-[var(--p-text-2)]">{c.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
