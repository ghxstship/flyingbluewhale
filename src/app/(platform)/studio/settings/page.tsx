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
  "/studio/settings/organization": "Name, tier, and member management",
  "/studio/settings/branding": "Portal and email appearance",
  "/studio/settings/domains": "Custom domains for portals",
  "/studio/settings/email-templates": "Transactional message copy and senders",
  "/studio/locations": "Venues, warehouses, and field sites",
  "/studio/marketplace/settings": "Take rate and public visibility",
  "/studio/people/roles": "Role definitions and permission scopes",
  "/studio/people/invites": "Pending and accepted team invitations",
  "/studio/settings/account-managers": "Pair portal contacts with their org-side manager",
  "/studio/settings/governance": "Approval chains and policy guardrails",
  "/studio/settings/time-clock-zones": "Geofenced punch-in zones for the field app",
  "/studio/settings/billing": "Subscription, payment methods, and invoices",
  "/studio/settings/exports": "Bulk data export center",
  "/studio/settings/imports": "Bulk data import center",
  "/studio/import": "Project-level import job queue",
  "/studio/settings/integrations": "Stripe, Slack, Google, ClickUp, and more",
  "/studio/settings/integrations/marketplace": "Discover and connect new apps",
  "/studio/settings/integrations/ticketing": "Sync external ticketing providers",
  "/studio/ai/automations": "Rules and triggers that drive behavior",
  "/studio/settings/api": "Programmatic access and rate limits",
  "/studio/settings/webhooks": "Outgoing event notifications",
  "/studio/settings/audit": "Every mutation, queryable",
  "/studio/settings/compliance": "Retention, DPA, and data export",
  "/studio/marketplace/reviews": "Bidirectional review moderation",
  "/studio/legal/privacy": "Privacy policy and data handling",
  "/studio/legal/privacy/dsar": "Data subject access requests",
  "/studio/legal/privacy/consent": "Consent records and preferences",
  "/studio/legal/privacy/datamap": "Where personal data lives and flows",
  "/studio/legal/ip": "IP, trademarks, and brand assets",
  "/studio/legal/insurance": "Coverage certificates and policies",
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
