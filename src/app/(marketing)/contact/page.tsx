import type { Metadata } from "next";
import { Mail, MessageCircle, Calendar, Building2 } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { buildMetadata, organizationSchema } from "@/lib/seo";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = buildMetadata({
  title: "Contact — Talk to the Studio",
  description:
    "Direct line. Demos, partnerships, concierge support, Festival access. Routed to producers who've run the room.",
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
    cta: "sales@lytehaus.live",
    href: "mailto:sales@lytehaus.live",
  },
  {
    icon: MessageCircle,
    title: "Concierge",
    body: "For current customers — triaged by tier. Festival gets an SLA.",
    cta: "support@lytehaus.live",
    href: "mailto:support@lytehaus.live",
  },
  {
    icon: Building2,
    title: "Partners",
    body: "Integrations, agencies, distribution. Build with us.",
    cta: "partners@lytehaus.live",
    href: "mailto:partners@lytehaus.live",
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
        <ContactForm />
      </section>

      <FAQSection title="Contact FAQ" faqs={FAQS} />
    </div>
  );
}
