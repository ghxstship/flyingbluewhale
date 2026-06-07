import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { DeleteForm } from "@/components/DeleteForm";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
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
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.settings.sso.eyebrow", undefined, "Settings")}
          title={t("console.settings.sso.title", undefined, "Single Sign-On")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.settings.sso.configureSupabase", undefined, "Configure Supabase.")}
          </div>
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
        eyebrow={t("console.settings.sso.eyebrow", undefined, "Settings")}
        title={t("console.settings.sso.title", undefined, "Single Sign-On")}
        subtitle={t(
          "console.settings.sso.subtitle",
          { count: providers.length, enabled: enabledCount },
          `${providers.length} configured · ${enabledCount} enabled · users with a matching email domain SSO-redirect at login`,
        )}
        breadcrumbs={[
          { label: t("console.settings.sso.breadcrumbSettings", undefined, "Settings"), href: "/console/settings" },
          { label: t("console.settings.sso.breadcrumbSso", undefined, "SSO") },
        ]}
      />
      <div className="page-content space-y-5">
        <DataTable<Row>
          rows={providers}
          emptyLabel={t("console.settings.sso.emptyLabel", undefined, "No SSO providers")}
          emptyDescription={t(
            "console.settings.sso.emptyDescription",
            undefined,
            "Add your IdP below. Once enabled, anyone signing in with one of the listed email domains gets bounced to your IdP instead of password auth.",
          )}
          columns={[
            {
              key: "name",
              header: t("console.settings.sso.col.name", undefined, "Name"),
              render: (r) => <span className="font-semibold">{r.name}</span>,
              accessor: (r) => r.name,
            },
            {
              key: "provider_type",
              header: t("console.settings.sso.col.protocol", undefined, "Protocol"),
              render: (r) => (
                <Badge variant={TYPE_TONE[r.provider_type] ?? "muted"}>{r.provider_type.toUpperCase()}</Badge>
              ),
              accessor: (r) => r.provider_type,
              filterable: true,
              groupable: true,
            },
            {
              key: "email_domains",
              header: t("console.settings.sso.col.emailDomains", undefined, "Email domains"),
              render: (r) =>
                r.email_domains.length === 0 ? (
                  <span className="text-xs text-[var(--p-text-2)]">—</span>
                ) : (
                  <span className="flex flex-wrap gap-1">
                    {r.email_domains.map((d) => (
                      <code key={d} className="font-mono text-xs text-[var(--p-text-2)]">
                        @{d}
                      </code>
                    ))}
                  </span>
                ),
              accessor: (r) => r.email_domains.join(","),
            },
            {
              key: "supabase_id",
              header: t("console.settings.sso.col.supabaseId", undefined, "Supabase ID"),
              render: (r) =>
                r.supabase_id ? (
                  <code className="font-mono text-xs">{r.supabase_id}</code>
                ) : (
                  <span className="text-xs text-[var(--p-text-2)]">
                    {t("console.settings.sso.unlinked", undefined, "unlinked")}
                  </span>
                ),
              accessor: (r) => r.supabase_id ?? "",
            },
            {
              key: "enabled",
              header: t("console.settings.sso.col.state", undefined, "State"),
              render: (r) => (
                <form action={toggleSsoProvider}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="enabled" value={String(!r.enabled)} />
                  <Button type="submit" variant="ghost" size="sm">
                    {r.enabled ? (
                      <Badge variant="success">{t("console.settings.sso.enabled", undefined, "Enabled")}</Badge>
                    ) : (
                      <Badge variant="muted">{t("console.settings.sso.disabled", undefined, "Disabled")}</Badge>
                    )}
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
                  confirm={t(
                    "console.settings.sso.deleteConfirm",
                    { name: r.name },
                    `Delete the "${r.name}" SSO provider? Users with email domains routed through it will fall back to password auth.`,
                  )}
                />
              ),
            },
          ]}
        />

        <section className="surface p-5">
          <h2 className="text-sm font-semibold">
            {t("console.settings.sso.addUpdate.title", undefined, "Add / Update Provider")}
          </h2>
          <p className="mt-1 text-xs text-[var(--p-text-2)]">
            {t(
              "console.settings.sso.addUpdate.description",
              undefined,
              "The Supabase ID links this provider row to the underlying Supabase Auth SSO config (created via the Supabase dashboard or admin API). Leave blank if you want to draft a provider before linking the IdP.",
            )}
          </p>
          <form
            action={upsertSsoProvider}
            className="surface-inset mt-3 grid grid-cols-1 gap-2 rounded-md p-3 sm:grid-cols-6"
          >
            <input
              name="name"
              required
              maxLength={120}
              placeholder={t(
                "console.settings.sso.form.namePlaceholder",
                undefined,
                'Display name (e.g. "Okta — Production")',
              )}
              className="ps-input sm:col-span-3"
            />
            <select name="provider_type" required defaultValue="saml" className="ps-input sm:col-span-1">
              <option value="saml">{t("console.settings.sso.form.saml", undefined, "SAML")}</option>
              <option value="oidc">{t("console.settings.sso.form.oidc", undefined, "OIDC")}</option>
            </select>
            <input
              name="email_domains"
              maxLength={500}
              placeholder={t(
                "console.settings.sso.form.emailDomainsPlaceholder",
                undefined,
                "acme.com, contractors.acme.com",
              )}
              className="ps-input sm:col-span-2"
            />
            <input
              name="supabase_id"
              maxLength={120}
              placeholder={t(
                "console.settings.sso.form.supabaseIdPlaceholder",
                undefined,
                "Supabase Auth SSO Provider ID · Optional",
              )}
              className="ps-input sm:col-span-3"
            />
            <input
              name="logout_url"
              type="url"
              maxLength={500}
              placeholder={t(
                "console.settings.sso.form.logoutUrlPlaceholder",
                undefined,
                "Single-logout URL · Optional",
              )}
              className="ps-input sm:col-span-3"
            />
            <label className="flex items-center gap-2 text-xs sm:col-span-3">
              <input type="checkbox" name="enabled" value="true" defaultChecked />
              {t(
                "console.settings.sso.form.enabledLabel",
                undefined,
                "Enabled on Save — Uncheck to Draft Without Activating",
              )}
            </label>
            <div className="flex justify-end sm:col-span-6">
              <Button type="submit" size="sm" variant="secondary">
                {t("console.settings.sso.form.save", undefined, "Save Provider")}
              </Button>
            </div>
          </form>
          <p className="mt-2 text-[10px] text-[var(--p-text-2)]">
            {t(
              "console.settings.sso.form.emailDomainsHint",
              undefined,
              "Email domains: comma-separated, no @. Lowercased on save.",
            )}
          </p>
        </section>
      </div>
    </>
  );
}
