// Static page — pre-render at build, no streaming Suspense on client nav.

import type { Metadata } from "next";
import { Mail, MessageCircle, Calendar, Building2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { buildMetadata, organizationSchema } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contact — Talk to the Studio",
  description:
    "Direct line. Demos, partnerships, concierge support, Festival access. Routed to producers who&apos;ve run the room.",
  path: "/contact",
  keywords: ["LYTEHAUS Technologies contact", "talk to sales", "production software demo", "book demo"],
  ogImageEyebrow: "Contact",
  ogImageTitle: "Talk to the Studio.",
});

const ROUTES = [
  {
    icon: Calendar,
    title: "Walkthrough",
    body: "Thirty minutes. Screen-share the console wired to a real production. No deck.",
    cta: "Get on the calendar",
    href: "#form",
  },
  {
    icon: Mail,
    title: "Studio",
    body: "Direct line to a producer. One business day, usually faster.",
    cta: "sales@lytehaus.tech",
    href: "mailto:sales@lytehaus.tech",
  },
  {
    icon: MessageCircle,
    title: "Concierge",
    body: "For current customers — triaged by tier. Festival gets an SLA.",
    cta: "support@lytehaus.tech",
    href: "mailto:support@lytehaus.tech",
  },
  {
    icon: Building2,
    title: "Partners",
    body: "Integrations, agencies, distribution. Build with us.",
    cta: "partners@lytehaus.tech",
    href: "mailto:partners@lytehaus.tech",
  },
];

const FAQS = [
  {
    q: "Do I need to call to get started?",
    a: "No. /signup and you're on Free — forever. 14-day trial on Crew or Production, no card. The studio is for Festival access, custom integrations, or a walkthrough.",
  },
  {
    q: "How fast does the studio respond?",
    a: "Studio: one business day. Concierge on Crew: 24 business hours. Production: 4. Festival: contractual SLA, usually one hour for P0.",
  },
  {
    q: "Can we talk to a producer, not a salesperson?",
    a: "Check the box in the form. We'll schedule a call with someone from the studio who's run productions on the platform.",
  },
  {
    q: "Where are you based?",
    a: "Distributed across the US — producers in NYC, LA, Miami, Chicago, Austin. Happy to show up in-person wherever the work is.",
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
        <div className="text-xs font-semibold tracking-[0.25em] text-[var(--org-primary)] uppercase">Contact</div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">Talk to the Studio.</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">
          No dark patterns. No forced calls. Open the console straight from{" "}
          <a className="underline" href="/signup">
            /signup
          </a>
          . Or request a walkthrough below — one business day, usually faster.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-4 md:grid-cols-2">
          {ROUTES.map(({ icon: Icon, title, body, cta, href }) => (
            <a key={title} href={href} className="surface hover-lift flex items-start gap-4 p-6">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--org-primary)]/10 text-[var(--org-primary)]">
                <Icon size={18} />
              </div>
              <div>
                <div className="text-sm font-semibold">{title}</div>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{body}</p>
                <div className="mt-2 font-mono text-xs text-[var(--org-primary)]">{cta}</div>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section id="form" className="mx-auto max-w-3xl px-6 py-12">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Leave a Note.</h2>
        <form className="surface mt-8 space-y-4 p-6" method="post" action="mailto:sales@lytehaus.tech">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              Name
              <input name="name" required className="input-base mt-1.5 w-full" />
            </label>
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              Work email
              <input name="email" type="email" required className="input-base mt-1.5 w-full" />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              Company
              <input name="company" className="input-base mt-1.5 w-full" />
            </label>
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              Productions per year
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
            What are you running?
            <textarea name="message" rows={4} className="input-base mt-1.5 w-full" />
          </label>
          <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <input type="checkbox" name="demo" /> I&apos;d rather walk it through live than trade emails.
          </label>
          <div className="flex items-center justify-end gap-2">
            <Button href="/signup" variant="secondary">
              Open the console instead
            </Button>
            <Button type="submit">Send to the Studio</Button>
          </div>
        </form>
      </section>

      <FAQSection title="Contact FAQ" faqs={FAQS} />
    </div>
  );
}
