import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { isAdmin as sessionIsAdmin, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";
import { updateOrgName } from "./actions";

export const dynamic = "force-dynamic";

export default async function OrgSettingsPage() {
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title="Organization" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  const session = await requireSession();
  const isAdmin = sessionIsAdmin(session);
  const supabase = await createClient();
  const { data: org } = await supabase.from("orgs").select("*").eq("id", session.orgId).maybeSingle();
  if (!org)
    return (
      <>
        <ModuleHeader title="Organization" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Organization not found.</div>
        </div>
      </>
    );

  const [{ count: members }, { count: invites }, { count: projects }] = await Promise.all([
    supabase
      .from("memberships")
      .select("*", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .is("deleted_at", null),
    supabase
      .from("invites")
      .select("*", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .eq("status", "pending"),
    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .is("deleted_at", null),
  ]);

  return (
    <>
      <ModuleHeader
        eyebrow="Settings"
        title={org.name}
        subtitle={`${members ?? 0} member${members === 1 ? "" : "s"} · ${org.tier}`}
      />
      <div className="page-content max-w-4xl space-y-6">
        <div className="metric-grid-4">
          <MetricCard label="Members" value={members ?? 0} accent />
          <MetricCard label="Pending invites" value={invites ?? 0} />
          <MetricCard label="Projects" value={projects ?? 0} />
          <MetricCard label="Tier" value={org.tier} />
        </div>

        <div className="surface space-y-4 p-5">
          <h3 className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
            Organization profile
          </h3>
          {isAdmin ? (
            <form action={updateOrgName} className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                name="name"
                defaultValue={org.name}
                required
                minLength={2}
                maxLength={120}
                className="rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm"
              />
              <Button type="submit" size="sm">
                Save
              </Button>
            </form>
          ) : (
            <Field label="Name" value={org.name} />
          )}
          <Field label="Slug" value={org.slug} mono />
          <Field label="Tier" value={<Badge variant="brand">{org.tier}</Badge>} />
          <Field label="Default currency" value={org.default_currency} mono />
          <Field label="Default timezone" value={org.default_timezone} mono />
          <Field label="Created" value={formatDate(org.created_at, "medium")} mono />
        </div>

        <div className="surface space-y-3 p-5">
          <h3 className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
            Member management
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Member directory + role transitions live under People. Invites land under People · Invites.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/console/people"
              className="rounded-md border border-[var(--border-color)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--surface-raised)]"
            >
              Member directory →
            </Link>
            <Link
              href="/console/people/invites"
              className="rounded-md border border-[var(--border-color)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--surface-raised)]"
            >
              Invites ({invites ?? 0} pending) →
            </Link>
            <Link
              href="/console/people/teams"
              className="rounded-md border border-[var(--border-color)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--surface-raised)]"
            >
              Teams →
            </Link>
            <Link
              href="/console/people/roles"
              className="rounded-md border border-[var(--border-color)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--surface-raised)]"
            >
              Roles →
            </Link>
          </div>
        </div>

        <div className="surface space-y-3 p-5">
          <h3 className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
            Workspace settings
          </h3>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/console/settings/branding"
              className="rounded-md border border-[var(--border-color)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--surface-raised)]"
            >
              Branding →
            </Link>
            <Link
              href="/console/settings/domains"
              className="rounded-md border border-[var(--border-color)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--surface-raised)]"
            >
              Domains →
            </Link>
            <Link
              href="/console/settings/billing"
              className="rounded-md border border-[var(--border-color)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--surface-raised)]"
            >
              Billing →
            </Link>
            <Link
              href="/console/settings/integrations"
              className="rounded-md border border-[var(--border-color)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--surface-raised)]"
            >
              Integrations →
            </Link>
            <Link
              href="/console/settings/audit"
              className="rounded-md border border-[var(--border-color)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--surface-raised)]"
            >
              Audit log →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 last:border-none last:pb-0">
      <div className="text-xs font-medium tracking-wide text-[var(--text-muted)] uppercase">{label}</div>
      <div className={`text-sm ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
