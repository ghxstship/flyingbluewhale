import type { Metadata } from "next";
import { Mail, MessageCircle, Calendar, Building2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { buildMetadata, organizationSchema } from "@/lib/seo";
export const metadata: Metadata = buildMetadata({
  title: "Contact — talk to sales, support, or partnerships",
  description:
    "Contact flyingbluewhale. Sales responds within one business day. Start a free account any time — no forced sales call. Partnerships, support, and press welcome.",
  path: "/contact",
  keywords: ["flyingbluewhale contact", "talk to sales", "production software demo", "book demo"],
  ogImageEyebrow: "Contact",
  ogImageTitle: "Talk to sales.",
});

const ROUTES = [
  { icon: Calendar, title: "Book a demo", body: "30 minutes, tailored to your show type. We'll screen-share the console and answer anything.", cta: "Book", href: "#form" },
  { icon: Mail, title: "Email sales", body: "Direct to a human. We respond within one business day.", cta: "sales@flyingbluewhale.app", href: "mailto:sales@flyingbluewhale.app" },
  { icon: MessageCircle, title: "Support", body: "For existing customers — tickets triaged by tier. Enterprise gets SLA'd.", cta: "support@flyingbluewhale.app", href: "mailto:support@flyingbluewhale.app" },
  { icon: Building2, title: "Partnerships", body: "Integrations, agencies, distribution. Let's talk.", cta: "partners@flyingbluewhale.app", href: "mailto:partners@flyingbluewhale.app" },
];

const FAQS = [
  {
    q: "Do I have to talk to sales to try flyingbluewhale?",
    a: "No. Sign up at /signup and you're in, free forever on the Access tier. Professional trial is 14 days, no credit card up front. Sales is for Enterprise, custom deployments, or if you just want a walkthrough.",
  },
  {
    q: "How fast is your response time?",
    a: "Sales: within one business day. Support (Starter+): 24 business hours. Support (Professional): 4 business hours. Support (Enterprise): contractual SLA, typically 1 business hour for P0.",
  },
  {
    q: "Can we talk to a real operator, not a salesperson?",
    a: "Yes — ask in the form. We'll schedule a call with someone from our ops team who has staffed shows on the platform.",
  },
  {
    q: "Where are you based?",
    a: "Distributed across the US, with operators in NYC, LA, Miami, Chicago, and Austin. Happy to do in-person anywhere a show is happening.",
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
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">Talk to Us.</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">
          No dark patterns, no forced sales call. Start free at <a className="underline" href="/signup">/signup</a>. Or
          book a demo below — we respond within one business day, usually faster.
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
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Send Us a Note.</h2>
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
            How can we help?<textarea name="message" rows={4} className="input-base mt-1.5 w-full" />
          </label>
          <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <input type="checkbox" name="demo" /> I'd like a live demo, not just email.
          </label>
          <div className="flex items-center justify-end gap-2">
            <Button href="/signup" variant="secondary">Start free instead</Button>
            <Button type="submit">Send</Button>
          </div>
        </form>
      </section>

      <FAQSection title="Contact FAQ" faqs={FAQS} />
    </div>
  );
}
