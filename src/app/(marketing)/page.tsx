// Home page is fully static. Pin it so Next.js serves pre-rendered HTML
// without a Suspense boundary on client-side nav — no loading flash.

import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
  Sparkles,
  FileSignature,
  QrCode,
  DollarSign,
  ClipboardCheck,
  ClipboardList,
  Camera,
  HardHat,
  Truck,
  Calendar,
  Layers,
  Bot,
} from "lucide-react";
import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { LogoCloud } from "@/components/marketing/LogoCloud";
import { StatStrip } from "@/components/marketing/StatStrip";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, organizationSchema, softwareApplicationSchema, SITE } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "FLYTEHAUS — Production Runs On It",
  description:
    "The platform for production. Pitch to wrap, in one console. Three apps, one schema, every module — pre-pro through strike.",
  path: "/",
  keywords: [
    "production management software",
    "event operations platform",
    "live event software",
    "festival operations platform",
    "experiential production platform",
    "FLYTEHAUS Technologies",
    "ATLVS",
    "GVTEWAY",
    "COMPVSS",
  ],
  ogImageTitle: "Production Runs On It.",
});

export default function Home() {
  return (
    <>
      <JsonLd
        data={[
          organizationSchema(),
          softwareApplicationSchema({
            name: "FLYTEHAUS Technologies",
            description: SITE.description,
            url: SITE.baseUrl,
            price: "0",
          }),
        ]}
      />

      {/* Hero — definitive, no pitch */}
      <section className="relative mx-auto max-w-6xl px-6 pt-24 pb-12 text-balance">
        <div className="text-xs font-semibold tracking-[0.25em] text-[var(--org-primary)] uppercase">
          FLYTEHAUS Technologies
        </div>
        <h1 className="mt-4 text-5xl leading-[1.05] font-semibold tracking-tight sm:text-7xl">
          Production
          <br />
          Runs On It.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-[var(--text-secondary)]">
          The platform for live work. Pitch to wrap, in one console. Three apps, one schema, every module — pre-pro
          through strike.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button href="/signup" size="lg">
            Open the Console
          </Button>
          <Button href="/contact" size="lg" variant="secondary">
            Talk to the Studio
          </Button>
          <Link href="/docs" className="btn btn-ghost btn-lg">
            Read the Docs →
          </Link>
        </div>

        {/* Live portal preview — anon visitors see real product chrome at
            reduced scale, no signup wall. sandbox="" blocks scripts/forms/popups
            inside the iframe. */}
        <div className="mt-14">
          <div className="relative overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--surface-inset)]">
            <div className="flex items-center gap-1.5 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2">
              <span
                className="h-2.5 w-2.5 rounded-full bg-[color-mix(in_oklab,var(--text-muted)_60%,transparent)]"
                aria-hidden="true"
              />
              <span
                className="h-2.5 w-2.5 rounded-full bg-[color-mix(in_oklab,var(--text-muted)_60%,transparent)]"
                aria-hidden="true"
              />
              <span
                className="h-2.5 w-2.5 rounded-full bg-[color-mix(in_oklab,var(--text-muted)_60%,transparent)]"
                aria-hidden="true"
              />
              <span className="ml-3 font-mono text-xs text-[var(--text-muted)]">
                flytehaus.live/p/mmw26-hialeah/guide
              </span>
            </div>
            <iframe
              src="/p/mmw26-hialeah/guide"
              title="Live Product Preview — MMW26 Hialeah Guest Guide"
              sandbox=""
              loading="lazy"
              className="h-[640px] w-full bg-[var(--background)]"
            />
          </div>
          <p className="mt-3 text-center text-xs text-[var(--text-muted)]">
            Live product. No signup wall. What your guest sees on their phone tonight.
          </p>
        </div>
      </section>

      <LogoCloud />

      {/* Three-app showcase */}
      <section className="mx-auto max-w-6xl px-6 pt-10 pb-16">
        <div className="text-center">
          <div className="text-xs font-semibold tracking-[0.25em] text-[var(--text-muted)] uppercase">
            Three apps · one schema
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">ATLVS · GVTEWAY · COMPVSS</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--text-secondary)]">
            One database. Three optimized surfaces. Same record from the office, the portal, and the field.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              slug: "atlvs",
              eyebrow: "ATLVS · The Console",
              title: "Where the production lives.",
              body: "RFIs, submittals, daily logs, punch list, inspections, advancing, finance, procurement, AI assistant. One sidebar. Pitch through wrap.",
              bullets: [
                "RFIs, submittals, daily logs, punch, inspections, change orders, payment apps",
                "Advancing — 16 typed deliverables. Riders, hospitality, stage plots, travel.",
                "Every change writes an immutable audit row — actor, IP, before, after",
              ],
              href: "/solutions/atlvs",
            },
            {
              slug: "gvteway",
              eyebrow: "GVTEWAY · The Portal",
              title: "Twelve personas. Each their lane.",
              body: "Artists see riders. Vendors see POs. Clients see proposals. Sponsors see activations. Same project, scoped reads, RLS at the database.",
              bullets: [
                "Artists, vendors, clients, sponsors, guests, crew, delegations, media, VIPs, volunteers, athletes",
                "Proposals signed in place — 23 block types, IP + timestamp captured on accept",
                "KBYG guides per persona, anonymous-shareable links, 17 section types",
              ],
              href: "/solutions/gvteway",
            },
            {
              slug: "compvss",
              eyebrow: "COMPVSS · The Field",
              title: "Offline. Sub-100ms.",
              body: "Gate scan, shift clock-in, daily log, incident, medic triage, driver run, guard tour, warehouse, daily safety brief. Works on one-bar LTE.",
              bullets: [
                "Sub-100ms QR + barcode scans. Queues offline. Replays on signal return.",
                "Shift check-in with meal credits, breaks, OSHA recordables",
                "Field intake — incidents, safeguarding, medical — encrypted, audit-logged",
              ],
              href: "/solutions/compvss",
            },
          ].map((app) => (
            <Link
              key={app.slug}
              href={app.href}
              data-platform={app.slug}
              className="surface hover-lift relative overflow-hidden p-6"
            >
              <span className="absolute inset-x-0 top-0 h-1" style={{ background: "var(--org-primary)" }} />
              <div
                className="text-[11px] font-semibold tracking-[0.2em] uppercase"
                style={{ color: "var(--org-primary)" }}
              >
                {app.eyebrow}
              </div>
              <h3 className="mt-2 text-lg font-semibold tracking-tight">{app.title}</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{app.body}</p>
              <ul className="mt-4 space-y-1.5 text-xs text-[var(--text-secondary)]">
                {app.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <span
                      className="mt-[6px] inline-block h-1 w-1 shrink-0 rounded-full"
                      style={{ background: "var(--org-primary)" }}
                    />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="mt-5 inline-flex items-center gap-1 text-xs font-medium">
                Walk the room <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <StatStrip
        stats={[
          { value: "47", label: "modules in the console" },
          { value: "1 schema", label: "across three apps" },
          { value: "<100ms", label: "gate scan, signal or none" },
          { value: "Per org", label: "never per seat" },
        ]}
      />

      {/* Pitch / Build / Wrap */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="text-xs font-semibold tracking-[0.2em] text-[var(--org-primary)] uppercase">
            Pitch · Build · Wrap
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Every Phase. One Console.
          </h2>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            The work doesn&apos;t hand off between platforms. Neither does the data.
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            {
              act: "PITCH",
              title: "Win the work.",
              body: "Proposals with 23 block types, signed in place. Phase gates that block invoicing until milestones close. Lead pipeline. Client CRM. Stripe checkout from accept.",
              stops: [
                "Proposals + e-sig (versioned, revocable)",
                "Lead + client CRM",
                "Phase gates + milestones",
                "Contracts + scope tracking",
                "Stripe checkout + Connect onboarding",
              ],
            },
            {
              act: "BUILD",
              title: "Run the production.",
              body: "RFIs, submittals, daily logs, punch list, inspections. Advancing — riders, hospitality, stage plots, travel. Crew, credentials, schedule, ROS, equipment, fab orders, site plans.",
              stops: [
                "RFIs · submittals · daily logs · punch",
                "Inspections — 10 categories, template-driven",
                "Advancing — 16 deliverable types",
                "Crew + credentials + call sheets",
                "Equipment, rentals, fab orders",
                "Schedule + ROS + 21-day look-ahead",
              ],
            },
            {
              act: "WRAP",
              title: "Settle clean.",
              body: "Invoices ship from completed work. Payments route through Stripe Connect to vendors directly. Audit log exports. Portal goes read-only. Files self-expire.",
              stops: [
                "Invoicing + Stripe Connect payouts",
                "Budget vs spent vs forecast (EAC)",
                "OSHA recordables + incident log",
                "Audit log export",
                "Self-expiring file shares",
              ],
            },
          ].map((act) => (
            <article key={act.act} className="surface p-6">
              <div className="text-[11px] font-semibold tracking-[0.25em] text-[var(--org-primary)] uppercase">
                {act.act}
              </div>
              <h3 className="mt-2 text-xl font-semibold">{act.title}</h3>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">{act.body}</p>
              <ul className="mt-4 space-y-1.5 text-xs">
                {act.stops.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-[var(--text-secondary)]">
                    <span
                      className="mt-[6px] inline-block h-1 w-1 shrink-0 rounded-full bg-[var(--org-primary)]"
                      aria-hidden
                    />
                    {s}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* Module index */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="text-xs font-semibold tracking-[0.2em] text-[var(--org-primary)] uppercase">Modules</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Every Module. Native.</h2>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            Forty-seven modules. Same database, same auth, same audit log. No integration tax.
          </p>
        </div>
        <div className="mt-10">
          <FeatureGrid
            cols={4}
            features={[
              {
                icon: FileSignature,
                title: "Proposals + e-sign",
                body: "23 block types, versioned, revocable share links. IP + timestamp captured on accept.",
                href: "/features/proposals",
              },
              {
                icon: Users,
                title: "Advancing",
                body: "Riders, hospitality, stage plots, travel, catering — 16 typed deliverables.",
                href: "/features/advancing",
              },
              {
                icon: ClipboardList,
                title: "RFIs · submittals · punch",
                body: "Ball-in-court routing, official answers, show-ready gate.",
                href: "/features/procore-parity",
              },
              {
                icon: HardHat,
                title: "Inspections",
                body: "Template-driven checklists across 10 categories. Pass/fail per item, photo evidence.",
                href: "/features/inspections",
              },
              {
                icon: DollarSign,
                title: "Finance + Stripe Connect",
                body: "Invoices, expenses, budgets, time, mileage. Vendor payouts native. We never touch the money.",
                href: "/features/finance",
              },
              {
                icon: ClipboardCheck,
                title: "Procurement",
                body: "RFQs, POs, vendor scorecards, COIs, W-9s, work order broadcasts.",
                href: "/features/procurement",
              },
              {
                icon: Sparkles,
                title: "Event guides (KBYG)",
                body: "One project, six personas, 17 section types — schedule, SOPs, PPE, radio, evac.",
                href: "/features/guides",
              },
              {
                icon: QrCode,
                title: "Gate + manifest scan",
                body: "Sub-100ms QR + barcode. Offline-queued. Replays in order on signal return.",
                href: "/features/ticketing",
              },
              {
                icon: Calendar,
                title: "Schedule + ROS",
                body: "Run-of-show, 21-day look-ahead, production calendar, crew availability, conflicts.",
                href: "/features/schedule",
              },
              {
                icon: Camera,
                title: "Photos + daily logs",
                body: "Project galleries, EXIF-aware, geo-tagged. Daily logs with weather + manpower + notes.",
                href: "/features/photos",
              },
              {
                icon: Truck,
                title: "Logistics + transport",
                body: "Freight, dispatch, ratecard, accommodation blocks, ground transport runs.",
                href: "/features/logistics",
              },
              {
                icon: ShieldCheck,
                title: "Safety stack",
                body: "Incidents, OSHA, medical, crisis comms, BC/DR, cyber-IR, safeguarding, environmental.",
                href: "/features/safety",
              },
              {
                icon: Bot,
                title: "AI assistant",
                body: "Streaming chat grounded in your workspace. Drafts riders, RFPs, recaps. Never the public web.",
                href: "/features/ai",
              },
              {
                icon: Layers,
                title: "Knowledge base",
                body: "Tagged articles. Public-form intake. Vendor training rolls up to compliance records.",
                href: "/features/knowledge",
              },
              {
                icon: Zap,
                title: "Forms",
                body: "Schema-driven. Public submission. Honeypot anti-spam. Submissions land in your tenant.",
                href: "/features/forms",
              },
              {
                icon: ShieldCheck,
                title: "Audit + compliance",
                body: "Every change writes an immutable row. Signed webhooks. Self-expiring share links.",
                href: "/features/compliance",
              },
            ]}
          />
        </div>
        <div className="mt-8 text-center">
          <Button href="/features" variant="secondary">
            All 47 modules →
          </Button>
        </div>
      </section>

      {/* Industries */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl font-semibold tracking-tight">Live Work, Whatever the Shape.</h2>
        <p className="mt-3 max-w-2xl text-sm text-[var(--text-secondary)]">
          The schema is generic. The vernacular is specific. Festivals. Residencies. Touring. Fab. Activations.
          Broadcast. Private events.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {[
            { slug: "live-events", title: "Festivals + residencies", sub: "15k+ guests, multi-day, multi-stage" },
            { slug: "fabrication", title: "Scenic + fabrication", sub: "Build shops, custom installs" },
            { slug: "touring", title: "Touring", sub: "Multi-city, per-stop advancing" },
            { slug: "corporate", title: "Brand + corporate", sub: "Activations, summits, AGMs" },
          ].map((x) => (
            <Link key={x.slug} href={`/solutions/${x.slug}`} className="surface hover-lift p-5">
              <div className="text-sm font-semibold">{x.title}</div>
              <div className="mt-1 text-xs text-[var(--text-muted)]">{x.sub}</div>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--org-primary)]">
                See the fit <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* What's true here */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="surface overflow-hidden">
          <div className="grid gap-10 p-10 md:grid-cols-2 md:items-center">
            <div>
              <div className="text-xs font-semibold tracking-[0.2em] text-[var(--org-primary)] uppercase">
                The Studio
              </div>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Built by the People Who Run the Show.</h2>
              <p className="mt-4 text-sm text-[var(--text-secondary)]">
                Every founder has run a load-in that didn&apos;t go to plan. Every module came out of opening a
                spreadsheet for the third time and saying &quot;why isn&apos;t this in the platform.&quot;
              </p>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                We ship to real shows the weekend before each release. If it doesn&apos;t survive load-in, it
                doesn&apos;t ship.
              </p>
              <div className="mt-6">
                <Button href="/about" variant="secondary" size="sm">
                  The studio
                </Button>
              </div>
            </div>
            <ul className="space-y-3 text-sm">
              {[
                "Per org. Not per seat. Add the whole crew.",
                "RLS at the database. Your tenant is walled off in Postgres.",
                "Vendor payouts via Stripe Connect. Money never crosses our books.",
                "Self-expiring file shares. No public buckets.",
                "Offline gate scan + shift clock-in. The cell tower is not your problem.",
                "AI grounded in your workspace. Never the public internet.",
                "Every change logged. Actor, IP, before, after. Forever.",
                "Three apps. One schema. One auth.",
              ].map((x) => (
                <li key={x} className="flex items-start gap-2">
                  <span className="status-dot status-dot-success mt-2" />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <FAQSection title="FAQ" faqs={HOME_FAQ} />

      <CTASection
        title="The Console Is Open."
        subtitle="Free, forever, for small teams. Per-org pricing the rest of the way up."
        primaryLabel="Open the console"
        primaryHref="/signup"
        secondaryLabel="Talk to the studio"
        secondaryHref="/contact"
      />
    </>
  );
}

const HOME_FAQ = [
  {
    q: "What does the platform do?",
    a: "Forty-seven modules across three apps that share one database. ATLVS is the office console — RFIs, submittals, daily logs, punch, advancing, finance, procurement, AI. GVTEWAY is the stakeholder portal — twelve personas, each their lane. COMPVSS is the offline-first field PWA — gate scan, shift clock-in, incidents, medical, daily safety brief. Same record, three optimized surfaces.",
  },
  {
    q: "Who's it for?",
    a: "Production teams running real live work. Festivals, residencies, touring, fabrication shops, brand activations, broadcast compounds, private events. The schema is generic; the vernacular is specific. If your org has a load-in, a manifest, vendors, and a wrap — it fits.",
  },
  {
    q: "How does pricing work?",
    a: "Per org, not per seat. Free forever for small teams. Crew opens up the team. Production unlocks every module + multi-project. Festival is multi-org with SSO, custom DPA, and 99.9% SLA. Full grid at /pricing.",
  },
  {
    q: "How do vendor payouts work?",
    a: "Stripe Connect. Vendors onboard a payout account through their portal. You approve the PO. Payouts route directly. Money never crosses our books. ACH, card, international wire. Signed webhooks for every event.",
  },
  {
    q: "Does the field app actually work offline?",
    a: "Yes. COMPVSS is an offline-first PWA. Gate scan, shift clock-in, daily log, incident, medic intake — all queue locally and sync on signal return. Sub-100ms scan even on one-bar LTE. Tested at 15,000-guest gates.",
  },
  {
    q: "How tight is the security?",
    a: "RLS at the database — your tenant is walled off in Postgres, not in the app layer. Every change writes to an immutable audit log (actor, IP, user agent, before/after). Signed webhooks (HMAC-SHA256). File shares self-expire. SOC-2 attestation + custom DPA on Festival tier.",
  },
  {
    q: "Is the AI useful or marketing?",
    a: "Useful. It reads your workspace data — never the public internet — and drafts riders, RFPs, call sheets, recaps, safety briefs, and incident reports. Streaming, conversation-persisted in your tenant. Anthropic Claude under the hood.",
  },
  {
    q: "Can I export my data?",
    a: "Always. CSV exports on every tier from every list view. Full data export via Settings → Exports on Production+. You own the database; we host it. Cancel and you get a 90-day read-only window to pull everything.",
  },
  {
    q: "How do I get started?",
    a: 'Open the console — 30 seconds, no card. Or talk to the studio if you want a walkthrough wired to a real production. We don\'t do "talk to sales" walls — the platform is open to look at.',
  },
];
