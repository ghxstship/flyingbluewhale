// Static page — pre-render at build, no streaming Suspense on client nav.

import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Headset, LifeBuoy, MessageCircle, ShieldAlert, Sparkles, Wrench } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { FAQSection, type FAQ } from "@/components/marketing/FAQ";
import { buildMetadata, organizationSchema, SITE } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Help — Crew Support",
  description:
    "Self-serve guides, status, and direct support channels. Concierge for customers — triaged by tier. Festival gets an SLA.",
  path: "/help",
  keywords: ["FLYTEHAUS help", "ATLVS support", "GVTEWAY support", "COMPVSS support", "event production software help"],
  ogImageEyebrow: "Help",
  ogImageTitle: "Crew Support.",
});

const CHANNELS = [
  {
    icon: BookOpen,
    title: "Field Guide",
    body: "Long-form guides on every shell — how to run a load-in week, set up advancing, wire Stripe payouts, configure portal access.",
    cta: "Open the field guide",
    href: "/docs",
  },
  {
    icon: Sparkles,
    title: "Changelog",
    body: "What shipped this week. Every release, with context on why it matters at load-in.",
    cta: "Read what shipped",
    href: "/changelog",
  },
  {
    icon: MessageCircle,
    title: "Concierge",
    body: "For customers — triaged by tier (Free, Crew, Production, Festival). Festival gets a four-hour SLA.",
    cta: "support@flytehaus.live",
    href: "mailto:support@flytehaus.live",
  },
  {
    icon: Headset,
    title: "Production hotline",
    body: "Live show in trouble? The hotline is staffed by producers, not bots. Available 24h during your event window if you've notified us.",
    cta: "Request hotline access",
    href: "/contact",
  },
];

const TROUBLESHOOTING = [
  {
    icon: ShieldAlert,
    title: "Can't sign in",
    body: "Try the magic-link flow first — it bypasses password issues. If your email isn't recognized, an admin needs to invite you. The producer or workspace owner can issue an invite from /console/people.",
  },
  {
    icon: Wrench,
    title: "Webhook isn't firing",
    body: "Check the audit log first (Settings → Audit). Webhooks ship signed; if signature verification fails on your end, the receipt won't register. Re-check the secret + the SHA-256 verification snippet in the docs.",
  },
  {
    icon: LifeBuoy,
    title: "Mobile app stuck offline",
    body: "Pull-to-refresh on the call sheet to force a sync. If a queued action shows as pending for more than 30 seconds, sign out and back in — that re-pairs the offline cache to the active workspace.",
  },
];

const FAQS: FAQ[] = [
  {
    q: "Where do I report a bug?",
    a: "Email support@flytehaus.live with the URL where it happened and a screenshot if you have one. We tag every report with the audit log entry so we can see exactly what happened on our side.",
  },
  {
    q: "Do you have a status page?",
    a: "Yes — status.flytehaus.live. Production incidents post within ten minutes. Maintenance windows announce 48 hours ahead.",
  },
  {
    q: "Can I get phone support?",
    a: "The production hotline is the closest thing — staffed by producers during active event windows. We don't run general phone support; concierge email gets to a human within hours, faster on Festival.",
  },
  {
    q: "Where do I find my invoice or change billing details?",
    a: "Inside the console: Settings → Billing. Stripe-hosted self-serve, so you can update card, download past invoices, or change billing email there directly.",
  },
  {
    q: "How do I cancel?",
    a: "Settings → Billing → Cancel subscription. Your data stays available read-only for 90 days; export anything you need from Settings → Exports during that window.",
  },
  {
    q: "I lost access to my admin account — what now?",
    a: "Contact concierge from the email on file with the org. We require a chain of identity proof to transfer ownership — typically founder/officer documentation. Plan ~3 business days for the handover.",
  },
];

export default function HelpPage() {
  const trail = [
    { label: "Home", href: "/" },
    { label: "Help", href: "/help" },
  ];

  return (
    <>
      <JsonLd
        data={[
          organizationSchema(),
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: trail.map((t, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: t.label,
              item: `${SITE.baseUrl}${t.href}`,
            })),
          },
        ]}
      />

      <section className="mx-auto max-w-6xl px-6 py-12">
        <Breadcrumbs items={trail} />
        <div className="mt-6 max-w-3xl">
          <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">Help</div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">Crew Support.</h1>
          <p className="mt-5 text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
            Self-serve guides for the patient, concierge for the urgent, hotline for the load-in. Choose your channel by
            how live the show is.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Get Help</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {CHANNELS.map(({ icon: Icon, title, body, cta, href }) => (
            <Link key={title} href={href} className="surface hover-lift block p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--org-primary)]/10 text-[var(--org-primary)]">
                  <Icon size={18} />
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
              </div>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">{body}</p>
              <div className="mt-4 text-xs font-semibold text-[var(--org-primary)]">{cta} →</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Common Issues</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {TROUBLESHOOTING.map(({ icon: Icon, title, body }) => (
            <div key={title} className="surface p-6">
              <div className="flex items-center gap-3">
                <Icon size={18} className="text-[var(--org-primary)]" />
                <h3 className="text-base font-semibold">{title}</h3>
              </div>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <FAQSection title="Help FAQ" faqs={FAQS} />

      <CTASection
        title="Still Stuck? Talk to a Producer."
        subtitle="Concierge email is the fastest path. We respond within hours, faster on Festival."
        primaryLabel="Email Concierge"
        primaryHref="mailto:support@flytehaus.live"
        secondaryLabel="Open the field guide"
        secondaryHref="/docs"
      />
    </>
  );
}
