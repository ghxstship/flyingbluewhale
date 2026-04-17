import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";

const TILES = [
  { href: "/console/settings/organization", label: "Organization", description: "Name, tier, member management" },
  { href: "/console/settings/billing", label: "Billing", description: "Subscription, payment methods, invoices" },
  { href: "/console/settings/integrations", label: "Integrations", description: "Stripe, Slack, Google, ClickUp, more" },
  { href: "/console/settings/api", label: "API keys", description: "Programmatic access + rate limits" },
  { href: "/console/settings/webhooks", label: "Webhooks", description: "Outgoing event notifications" },
  { href: "/console/settings/audit", label: "Audit log", description: "Every mutation, queryable" },
  { href: "/console/settings/compliance", label: "Compliance", description: "Retention, DPA, data export" },
  { href: "/console/settings/branding", label: "Branding", description: "Portal + email appearance" },
  { href: "/console/settings/domains", label: "Domains", description: "Custom domains for portals" },
];

export default function SettingsHub() {
  return (
    <>
      <ModuleHeader eyebrow="Settings" title="Workspace settings" subtitle="Configure your organization" />
      <div className="page-content">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TILES.map((t) => (
            <Link key={t.href} href={t.href} className="surface hover-lift p-5">
              <div className="text-sm font-semibold">{t.label}</div>
              <div className="mt-1 text-xs text-[var(--text-muted)]">{t.description}</div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
