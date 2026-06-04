import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";

export default async function SettingsHub() {
  const { t } = await getRequestT();
  const tiles = [
    {
      href: "/console/settings/organization",
      label: t("console.settings.tiles.organization.label", undefined, "Organization"),
      description: t("console.settings.tiles.organization.description", undefined, "Name, tier, member management"),
    },
    {
      href: "/console/settings/billing",
      label: t("console.settings.tiles.billing.label", undefined, "Billing"),
      description: t(
        "console.settings.tiles.billing.description",
        undefined,
        "Subscription, payment methods, invoices",
      ),
    },
    {
      href: "/console/settings/integrations",
      label: t("console.settings.tiles.integrations.label", undefined, "Integrations"),
      description: t(
        "console.settings.tiles.integrations.description",
        undefined,
        "Stripe, Slack, Google, ClickUp, more",
      ),
    },
    {
      href: "/console/settings/api",
      label: t("console.settings.tiles.api.label", undefined, "API keys"),
      description: t("console.settings.tiles.api.description", undefined, "Programmatic access + rate limits"),
    },
    {
      href: "/console/settings/webhooks",
      label: t("console.settings.tiles.webhooks.label", undefined, "Webhooks"),
      description: t("console.settings.tiles.webhooks.description", undefined, "Outgoing event notifications"),
    },
    {
      href: "/console/settings/audit",
      label: t("console.settings.tiles.audit.label", undefined, "Audit Log"),
      description: t("console.settings.tiles.audit.description", undefined, "Every mutation, queryable"),
    },
    {
      href: "/console/settings/compliance",
      label: t("console.settings.tiles.compliance.label", undefined, "Compliance"),
      description: t("console.settings.tiles.compliance.description", undefined, "Retention, DPA, data export"),
    },
    {
      href: "/console/settings/branding",
      label: t("console.settings.tiles.branding.label", undefined, "Branding"),
      description: t("console.settings.tiles.branding.description", undefined, "Portal + email appearance"),
    },
    {
      href: "/console/settings/domains",
      label: t("console.settings.tiles.domains.label", undefined, "Domains"),
      description: t("console.settings.tiles.domains.description", undefined, "Custom domains for portals"),
    },
    {
      href: "/console/settings/sequences",
      label: t("console.settings.tiles.sequences.label", undefined, "Auto-Numbers"),
      description: t(
        "console.settings.tiles.sequences.description",
        undefined,
        "Invoice, PO, proposal identifier formats",
      ),
    },
    {
      href: "/console/settings/sla-policies",
      label: t("console.settings.tiles.slaPolicies.label", undefined, "SLA Policies"),
      description: t(
        "console.settings.tiles.slaPolicies.description",
        undefined,
        "Per-severity response + resolution clocks for service requests",
      ),
    },
    {
      href: "/console/settings/sso",
      label: t("console.settings.tiles.sso.label", undefined, "Single Sign-On"),
      description: t(
        "console.settings.tiles.sso.description",
        undefined,
        "SAML / OIDC providers + email-domain routing",
      ),
    },
    {
      href: "/console/settings/rate-limits",
      label: t("console.settings.tiles.rateLimits.label", undefined, "Rate Limits"),
      description: t(
        "console.settings.tiles.rateLimits.description",
        undefined,
        "Per-bucket overrides for AI, scan, webhook, auth",
      ),
    },
  ];
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.settings.eyebrow", undefined, "Settings")}
        title={t("console.settings.title", undefined, "Workspace Settings")}
        subtitle={t("console.settings.subtitle", undefined, "Configure your organization")}
      />
      <div className="page-content">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((tile) => (
            <Link key={tile.href} href={tile.href} className="surface hover-lift p-5">
              <div className="text-sm font-semibold">{tile.label}</div>
              <div className="mt-1 text-xs text-[var(--text-muted)]">{tile.description}</div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
