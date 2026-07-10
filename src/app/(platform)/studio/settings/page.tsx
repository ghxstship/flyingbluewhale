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

// href → one-line description, keyed through t() (B-28). Body copy, so
// sentence case is fine. The two import surfaces get deliberately distinct
// copy so the hub explains the split instead of duplicating it (B-21):
// settings/imports is where you start an import; /studio/import is where
// you watch the resulting jobs run.
function buildDescriptions(t: (key: string, params?: Record<string, string | number>, fallback?: string) => string) {
  return {
    "/studio/settings/organization": t(
      "console.settings.hub.desc.organization",
      undefined,
      "Name, tier, and member management",
    ),
    "/studio/settings/branding": t("console.settings.hub.desc.branding", undefined, "Portal and email appearance"),
    "/studio/settings/domains": t("console.settings.hub.desc.domains", undefined, "Custom domains for portals"),
    "/studio/settings/email-templates": t(
      "console.settings.hub.desc.emailTemplates",
      undefined,
      "Transactional message copy and senders",
    ),
    "/studio/locations": t("console.settings.hub.desc.locations", undefined, "Venues, warehouses, and field sites"),
    "/studio/marketplace/settings": t(
      "console.settings.hub.desc.marketplaceSettings",
      undefined,
      "Take rate and public visibility",
    ),
    "/studio/people/roles": t(
      "console.settings.hub.desc.peopleRoles",
      undefined,
      "Role definitions and permission scopes",
    ),
    "/studio/people/invites": t(
      "console.settings.hub.desc.peopleInvites",
      undefined,
      "Pending and accepted team invitations",
    ),
    "/studio/settings/account-managers": t(
      "console.settings.hub.desc.accountManagers",
      undefined,
      "Pair portal contacts with their org-side manager",
    ),
    "/studio/settings/governance": t(
      "console.settings.hub.desc.governance",
      undefined,
      "Approval chains and policy guardrails",
    ),
    "/studio/settings/time-clock-zones": t(
      "console.settings.hub.desc.timeClockZones",
      undefined,
      "Geofenced punch-in zones for the field app",
    ),
    "/studio/settings/billing": t(
      "console.settings.hub.desc.billing",
      undefined,
      "Subscription, payment methods, and invoices",
    ),
    "/studio/settings/exports": t("console.settings.hub.desc.exports", undefined, "Bulk data export center"),
    "/studio/settings/imports": t(
      "console.settings.hub.desc.imports",
      undefined,
      "Start a bulk import: upload CSVs and map columns",
    ),
    "/studio/import": t("console.settings.hub.desc.importJobs", undefined, "Watch running and completed import jobs"),
    "/studio/settings/integrations": t(
      "console.settings.hub.desc.integrations",
      undefined,
      "Stripe, Slack, Google, ClickUp, and more",
    ),
    "/studio/settings/integrations/marketplace": t(
      "console.settings.hub.desc.integrationsMarketplace",
      undefined,
      "Discover and connect new apps",
    ),
    "/studio/settings/integrations/ticketing": t(
      "console.settings.hub.desc.integrationsTicketing",
      undefined,
      "Sync external ticketing providers",
    ),
    "/studio/ai/automations": t(
      "console.settings.hub.desc.automations",
      undefined,
      "Rules and triggers that drive behavior",
    ),
    "/studio/settings/api": t("console.settings.hub.desc.api", undefined, "Programmatic access and rate limits"),
    "/studio/settings/webhooks": t("console.settings.hub.desc.webhooks", undefined, "Outgoing event notifications"),
    "/studio/settings/audit": t("console.settings.hub.desc.audit", undefined, "Every mutation, queryable"),
    "/studio/settings/compliance": t(
      "console.settings.hub.desc.compliance",
      undefined,
      "Retention, DPA, and data export",
    ),
    "/studio/marketplace/reviews": t(
      "console.settings.hub.desc.marketplaceReviews",
      undefined,
      "Bidirectional review moderation",
    ),
    "/studio/legal/privacy": t("console.settings.hub.desc.privacy", undefined, "Privacy policy and data handling"),
    "/studio/legal/privacy/dsar": t("console.settings.hub.desc.dsar", undefined, "Data subject access requests"),
    "/studio/legal/privacy/consent": t(
      "console.settings.hub.desc.consent",
      undefined,
      "Consent records and preferences",
    ),
    "/studio/legal/privacy/datamap": t(
      "console.settings.hub.desc.datamap",
      undefined,
      "Where personal data lives and flows",
    ),
    "/studio/legal/ip": t("console.settings.hub.desc.ip", undefined, "IP, trademarks, and brand assets"),
    "/studio/legal/insurance": t(
      "console.settings.hub.desc.insurance",
      undefined,
      "Coverage certificates and policies",
    ),
  } as Record<string, string>;
}

export default async function SettingsHub() {
  const { t } = await getRequestT();
  const DESCRIPTIONS = buildDescriptions(t);
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.settings.eyebrow", undefined, "Settings")}
        title={t("console.settings.title", undefined, "Workspace Settings")}
        subtitle={t("console.settings.subtitle", undefined, "Configure your organization")}
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
