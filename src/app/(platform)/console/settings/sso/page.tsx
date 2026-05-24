import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { DeleteForm } from "@/components/DeleteForm";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { deleteSsoProvider, toggleSsoProvider, upsertSsoProvider } from "./actions";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  provider_type: "saml" | "oidc";
  name: string;
  supabase_id: string | null;
  logout_url: string | null;
  email_domains: string[];
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

const TYPE_TONE: Record<string, "muted" | "info"> = {
  saml: "info",
  oidc: "muted",
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Settings" title="Single Sign-On" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("org_sso_providers")
    .select("id, provider_type, name, supabase_id, logout_url, email_domains, enabled, created_at, updated_at")
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false });
  const providers = (rows ?? []) as Row[];
  const enabledCount = providers.filter((p) => p.enabled).length;

  return (
    <>
      <ModuleHeader
        eyebrow="Settings"
        title="Single Sign-On"
        subtitle={`${providers.length} configured · ${enabledCount} enabled · users with a matching email domain SSO-redirect at login`}
        breadcrumbs={[{ label: "Settings", href: "/console/settings" }, { label: "SSO" }]}
      />
      <div className="page-content space-y-5">
        <DataTable<Row>
          rows={providers}
          emptyLabel="No SSO providers"
          emptyDescription="Add your IdP below. Once enabled, anyone signing in with one of the listed email domains gets bounced to your IdP instead of password auth."
          columns={[
            {
              key: "name",
              header: "Name",
              render: (r) => <span className="font-semibold">{r.name}</span>,
              accessor: (r) => r.name,
            },
            {
              key: "provider_type",
              header: "Protocol",
              render: (r) => (
                <Badge variant={TYPE_TONE[r.provider_type] ?? "muted"}>{r.provider_type.toUpperCase()}</Badge>
              ),
              accessor: (r) => r.provider_type,
              filterable: true,
              groupable: true,
            },
            {
              key: "email_domains",
              header: "Email domains",
              render: (r) =>
                r.email_domains.length === 0 ? (
                  <span className="text-xs text-[var(--text-muted)]">—</span>
                ) : (
                  <span className="flex flex-wrap gap-1">
                    {r.email_domains.map((d) => (
                      <code key={d} className="font-mono text-xs text-[var(--text-secondary)]">
                        @{d}
                      </code>
                    ))}
                  </span>
                ),
              accessor: (r) => r.email_domains.join(","),
            },
            {
              key: "supabase_id",
              header: "Supabase ID",
              render: (r) =>
                r.supabase_id ? (
                  <code className="font-mono text-xs">{r.supabase_id}</code>
                ) : (
                  <span className="text-xs text-[var(--text-muted)]">unlinked</span>
                ),
              accessor: (r) => r.supabase_id ?? "",
            },
            {
              key: "enabled",
              header: "State",
              render: (r) => (
                <form action={toggleSsoProvider}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="enabled" value={String(!r.enabled)} />
                  <Button type="submit" variant="ghost" size="sm">
                    {r.enabled ? <Badge variant="success">Enabled</Badge> : <Badge variant="muted">Disabled</Badge>}
                  </Button>
                </form>
              ),
            },
            {
              key: "actions",
              header: "",
              render: (r) => (
                <DeleteForm
                  action={deleteSsoProvider.bind(null, r.id)}
                  confirm={`Delete the "${r.name}" SSO provider? Users with email domains routed through it will fall back to password auth.`}
                />
              ),
            },
          ]}
        />

        <section className="surface p-5">
          <h2 className="text-sm font-semibold">Add / Update Provider</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            The Supabase ID links this provider row to the underlying Supabase Auth SSO config (created via the Supabase
            dashboard or admin API). Leave blank if you want to draft a provider before linking the IdP.
          </p>
          <form
            action={upsertSsoProvider}
            className="surface-inset mt-3 grid grid-cols-1 gap-2 rounded-md p-3 sm:grid-cols-6"
          >
            <input
              name="name"
              required
              maxLength={120}
              placeholder='Display name (e.g. "Okta — Production")'
              className="input-base sm:col-span-3"
            />
            <select name="provider_type" required defaultValue="saml" className="input-base sm:col-span-1">
              <option value="saml">SAML</option>
              <option value="oidc">OIDC</option>
            </select>
            <input
              name="email_domains"
              maxLength={500}
              placeholder="acme.com, contractors.acme.com"
              className="input-base sm:col-span-2"
            />
            <input
              name="supabase_id"
              maxLength={120}
              placeholder="Supabase Auth SSO provider ID (optional)"
              className="input-base sm:col-span-3"
            />
            <input
              name="logout_url"
              type="url"
              maxLength={500}
              placeholder="Single-logout URL (optional)"
              className="input-base sm:col-span-3"
            />
            <label className="flex items-center gap-2 text-xs sm:col-span-3">
              <input type="checkbox" name="enabled" value="true" defaultChecked />
              Enabled on save (uncheck to draft without activating)
            </label>
            <div className="flex justify-end sm:col-span-6">
              <Button type="submit" size="sm" variant="secondary">
                Save Provider
              </Button>
            </div>
          </form>
          <p className="mt-2 text-[10px] text-[var(--text-muted)]">
            Email domains: comma-separated, no <code>@</code>. Lowercased on save.
          </p>
        </section>
      </div>
    </>
  );
}
