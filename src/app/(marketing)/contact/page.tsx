// Static page — pre-render at build, no streaming Suspense on client nav.
export const dynamic = "force-static";

import type { Metadata } from "next";
import { Mail, MessageCircle, Calendar, Building2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { buildMetadata, organizationSchema } from "@/lib/seo";
export const metadata: Metadata = buildMetadata({
  title: "Contact — Ring the Promoter",
  description:
    "Talk to the crew. Sales rings back within a business day. Free on GA forever. Walkthroughs, partnerships, support, press — all routed to humans who&apos;ve worked doors.",
  path: "/contact",
  keywords: ["Second Star Technologies contact", "talk to sales", "production software demo", "book demo"],
  ogImageEyebrow: "Contact",
  ogImageTitle: "Ring the Promoter.",
});

const ROUTES = [
  { icon: Calendar, title: "Backstage walkthrough", body: "30 minutes, tailored to your kind of night. We screen-share the console and answer anything.", cta: "Get on the calendar", href: "#form" },
  { icon: Mail, title: "Ring the promoter", body: "Direct line to a human who&apos;s worked doors. One business day, usually faster.", cta: "sales@flyingbluewhale.app", href: "mailto:sales@flyingbluewhale.app" },
  { icon: MessageCircle, title: "Support", body: "Current acts only — triaged by tier. Festival tier gets SLA&apos;d.", cta: "support@flyingbluewhale.app", href: "mailto:support@flyingbluewhale.app" },
  { icon: Building2, title: "Co-headliners", body: "Integrations, agencies, distribution. Let&apos;s split the bill.", cta: "partners@flyingbluewhale.app", href: "mailto:partners@flyingbluewhale.app" },
];

const FAQS = [
  {
    q: "Do I have to talk to sales to try it?",
    a: "No. /signup and you&apos;re on the GA tier — free forever. 14-night soundcheck on All-Access or Headliner, no card. Sales is for Festival tier, custom deployments, or backstage walkthroughs with a human.",
  },
  {
    q: "How fast do you ring back?",
    a: "Sales: one business day. Support on All-Access: 24 business hours. Headliner: 4. Festival: contractual SLA, usually 1 hour for P0. We pick up fast — shows don&apos;t wait.",
  },
  {
    q: "Can we talk to an operator, not a salesperson?",
    a: "Yes — check the box in the form. We&apos;ll schedule a call with someone from the ops crew who&apos;s shipped shows on this rig.",
  },
  {
    q: "Where are you based?",
    a: "Distributed across the US — operators in NYC, LA, Miami, Chicago, Austin. Happy to roll up in-person anywhere a show is happening.",
  },
];

export default function ContactPage() {
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <div>
      <JsonLd data={[organizationSchema()]} />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--org-primary)]">Contact</div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">Ring the Promoter.</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">
          No dark patterns. No forced sales calls. Skip the line and get on the list at <a className="underline" href="/signup">/signup</a>. Or request a backstage walkthrough below — one business day, usually faster.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-4 md:grid-cols-2">
          {ROUTES.map(({ icon: Icon, title, body, cta, href }) => (
            <a key={title} href={href} className="surface-raised hover-lift flex items-start gap-4 p-6">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--org-primary)]/10 text-[var(--org-primary)]">
                <Icon size={18} />
              </div>
              <div>
                <div className="text-sm font-semibold">{title}</div>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{body}</p>
                <div className="mt-2 text-xs font-mono text-[var(--org-primary)]">{cta}</div>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section id="form" className="mx-auto max-w-3xl px-6 py-12">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Drop a Note Backstage.</h2>
        <form
          className="surface-raised mt-8 space-y-4 p-6"
          method="post"
          action="mailto:sales@flyingbluewhale.app"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              Name<input name="name" required className="input-base mt-1.5 w-full" />
            </label>
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              Work email<input name="email" type="email" required className="input-base mt-1.5 w-full" />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              Company<input name="company" className="input-base mt-1.5 w-full" />
            </label>
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              Show count / year
              <select name="scale" className="input-base mt-1.5 w-full">
                <option>1–5</option>
                <option>6–20</option>
                <option>21–50</option>
                <option>50+</option>
              </select>
            </label>
          </div>
          <label className="block text-xs font-medium text-[var(--text-secondary)]">
            What do you run?
            <select name="vertical" className="input-base mt-1.5 w-full">
              <option>Live events / festivals</option>
              <option>Touring / artist management</option>
              <option>Corporate / activations</option>
              <option>Fabrication / shop</option>
              <option>Other</option>
            </select>
          </label>
          <label className="block text-xs font-medium text-[var(--text-secondary)]">
            What are you running?<textarea name="message" rows={4} className="input-base mt-1.5 w-full" />
          </label>
          <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <input type="checkbox" name="demo" /> I&apos;d rather walk it through live than trade emails.
          </label>
          <div className="flex items-center justify-end gap-2">
            <Button href="/signup" variant="secondary">Get on the list instead</Button>
            <Button type="submit">Send to backstage</Button>
          </div>
        </form>
      </section>

      <FAQSection title="Contact FAQ" faqs={FAQS} />
    </div>
  );
}
