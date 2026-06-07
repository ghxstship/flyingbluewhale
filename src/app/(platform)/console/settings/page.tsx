import Link from "next/link";
import { Building2, Users, HardHat, CreditCard, Plug, ShieldCheck, ChevronRight, type LucideIcon } from "lucide-react";
import { ModuleHeader } from "@/components/Shell";
import { settingsNav } from "@/lib/nav";
import { getRequestT } from "@/lib/i18n/request";

/**
 * Settings overview — a real index, not a dead-end pane. Every group in
 * `settingsNav` (the SSOT) gets a section here with a card per destination,
 * so the index can never drift out of sync with the left rail. Each card
 * carries a one-line description keyed by href; unmapped items fall back to
 * their label so a newly-added nav entry still renders a usable card.
 */

// Group label → section icon. Keyed by the canonical `settingsNav` labels.
const GROUP_ICONS: Record<string, LucideIcon> = {
  Workspace: Building2,
  "Team & Access": Users,
  "Field Config": HardHat,
  "Billing & Data": CreditCard,
  Integrations: Plug,
  Compliance: ShieldCheck,
};

// href → one-line description. Body copy, so sentence case is fine.
const DESCRIPTIONS: Record<string, string> = {
  "/console/settings/organization": "Name, tier, and member management",
  "/console/settings/branding": "Portal and email appearance",
  "/console/settings/domains": "Custom domains for portals",
  "/console/settings/email-templates": "Transactional message copy and senders",
  "/console/locations": "Venues, warehouses, and field sites",
  "/console/marketplace/settings": "Take rate and public visibility",
  "/console/people/roles": "Role definitions and permission scopes",
  "/console/people/invites": "Pending and accepted team invitations",
  "/console/settings/account-managers": "Pair portal contacts with their org-side manager",
  "/console/settings/governance": "Approval chains and policy guardrails",
  "/console/settings/time-clock-zones": "Geofenced punch-in zones for the field app",
  "/console/settings/billing": "Subscription, payment methods, and invoices",
  "/console/settings/exports": "Bulk data export center",
  "/console/settings/imports": "Bulk data import center",
  "/console/import": "Project-level import job queue",
  "/console/settings/integrations": "Stripe, Slack, Google, ClickUp, and more",
  "/console/settings/integrations/marketplace": "Discover and connect new apps",
  "/console/settings/integrations/ticketing": "Sync external ticketing providers",
  "/console/ai/automations": "Rules and triggers that drive behavior",
  "/console/settings/api": "Programmatic access and rate limits",
  "/console/settings/webhooks": "Outgoing event notifications",
  "/console/settings/audit": "Every mutation, queryable",
  "/console/settings/compliance": "Retention, DPA, and data export",
  "/console/marketplace/reviews": "Bidirectional review moderation",
  "/console/legal/privacy": "Privacy policy and data handling",
  "/console/legal/privacy/dsar": "Data subject access requests",
  "/console/legal/privacy/consent": "Consent records and preferences",
  "/console/legal/privacy/datamap": "Where personal data lives and flows",
  "/console/legal/ip": "IP, trademarks, and brand assets",
  "/console/legal/insurance": "Coverage certificates and policies",
};

export default async function SettingsHub() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.settings.eyebrow", undefined, "Settings")}
        title={t("console.settings.title", undefined, "Workspace Settings")}
        subtitle={t(
          "console.settings.subtitle",
          undefined,
          "Configure your organization — pick an area to get started",
        )}
      />
      <div className="page-content space-y-8">
        {settingsNav.map((group) => {
          const Icon = GROUP_ICONS[group.label] ?? Building2;
          return (
            <section key={group.label}>
              <div className="mb-3 flex items-center gap-2">
                <Icon size={16} className="text-[var(--p-text-2)]" aria-hidden="true" />
                <h2 className="text-xs font-semibold tracking-[0.18em] text-[var(--p-text-2)] uppercase">
                  {group.label}
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="surface hover-lift group flex items-start justify-between gap-3 p-4"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[var(--p-text-1)]">{item.label}</div>
                      <div className="mt-1 text-xs text-[var(--p-text-2)]">{DESCRIPTIONS[item.href] ?? item.label}</div>
                    </div>
                    <ChevronRight
                      size={16}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-[var(--p-text-2)] transition-transform group-hover:translate-x-0.5"
                    />
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
