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
  title: "Contact — Call the Studio",
  description:
    "A direct line to the taste-makers&apos; studio. Captain&apos;s briefings, Private Charter access, partnerships, concierge support. Routed to producers who&apos;ve charted the crossings.",
  path: "/contact",
  keywords: ["Second Star Technologies contact", "talk to sales", "production software demo", "book demo"],
  ogImageEyebrow: "Contact",
  ogImageTitle: "Call the Studio.",
});

const ROUTES = [
  { icon: Calendar, title: "Captain&apos;s briefing", body: "Thirty minutes, tailored to your crossing. We screen-share the Atlas and answer anything.", cta: "Get on the calendar", href: "#form" },
  { icon: Mail, title: "Call the studio", body: "Direct line to a producer. One business day, usually faster.", cta: "sales@flyingbluewhale.app", href: "mailto:sales@flyingbluewhale.app" },
  { icon: MessageCircle, title: "Concierge", body: "For current pass holders — triaged by cabin. Private Charter gets an SLA.", cta: "support@flyingbluewhale.app", href: "mailto:support@flyingbluewhale.app" },
  { icon: Building2, title: "Co-pilots", body: "Integrations, agencies, distribution. Let&apos;s chart the voyage together.", cta: "partners@flyingbluewhale.app", href: "mailto:partners@flyingbluewhale.app" },
];

const FAQS = [
  {
    q: "Do I need to call to book passage?",
    a: "No. /signup and you&apos;re on the Day Pass — free forever. A fourteen-night soundcheck on Festival Pass or Voyager, no card. The studio is for Private Charter, custom crossings, or a captain&apos;s briefing.",
  },
  {
    q: "How fast does the studio ring back?",
    a: "Studio: one business day. Concierge on Festival Pass: twenty-four business hours. Voyager: four. Private Charter: contractual SLA, usually one hour for P0. Crossings don&apos;t wait.",
  },
  {
    q: "Can we talk to a producer, not a salesperson?",
    a: "Check the box in the form. We&apos;ll schedule a call with someone from the studio who&apos;s charted crossings on the Atlas.",
  },
  {
    q: "Where are you based?",
    a: "Distributed across the US — producers in NYC, LA, Miami, Chicago, Austin. Happy to turn up in-person wherever the crossing lands.",
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
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">Call the Studio.</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">
          No dark patterns. No forced calls. Book passage straight from <a className="underline" href="/signup">/signup</a>. Or request a captain&apos;s briefing below — one business day, usually faster.
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
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Leave a Note.</h2>
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
            What are you charting?<textarea name="message" rows={4} className="input-base mt-1.5 w-full" />
          </label>
          <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <input type="checkbox" name="demo" /> I&apos;d rather walk it through live than trade emails.
          </label>
          <div className="flex items-center justify-end gap-2">
            <Button href="/signup" variant="secondary">Book passage instead</Button>
            <Button type="submit">Send to the studio</Button>
          </div>
        </form>
      </section>

      <FAQSection title="Contact FAQ" faqs={FAQS} />
    </div>
  );
}
