import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function Home() {
  return (
    <div>
      <section className="mx-auto max-w-6xl px-6 pt-24 pb-16 text-balance">
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--org-primary)]">
          Production OS · v1
        </div>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-[var(--foreground)] sm:text-6xl">
          Run production.<br />Not spreadsheets.
        </h1>
        <p className="mt-6 max-w-2xl text-base text-[var(--text-secondary)]">
          flyingbluewhale unifies your internal operations console, every external stakeholder portal,
          and a field-ready mobile PWA — built for live events, fabrication, and creative ops.
        </p>
        <div className="mt-8 flex gap-3">
          <Button href="/signup" size="lg">Start free</Button>
          <Button href="/contact" size="lg" variant="secondary">Talk to sales</Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="metric-grid-3">
          {[
            { title: "Console", brand: "atlvs", desc: "Projects, finance, procurement, production, people, AI — role-gated by tier." },
            { title: "Portals", brand: "gvteway", desc: "Slug-scoped workspaces for artists, vendors, clients, sponsors, guests, crew." },
            { title: "Mobile", brand: "compvss", desc: "Offline-first PWA: ticket scan, clock in/out, inventory scan, incident reports." },
          ].map((c) => (
            <Link key={c.title} href="/features" data-platform={c.brand} className="surface-raised hover-lift p-6">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--org-primary)]">
                {c.title}
              </div>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">{c.desc}</p>
              <div className="mt-4 text-xs font-medium text-[var(--text-muted)]">Learn more →</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="text-2xl font-semibold tracking-tight">Built for the entire production stack</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {["Live events", "Fabrication", "Touring", "Corporate"].map((s) => (
            <Link
              key={s}
              href={`/solutions/${s.toLowerCase().replace(" ", "-")}`}
              className="surface hover-lift p-4"
            >
              <div className="text-sm font-medium">{s}</div>
              <div className="mt-1 text-xs text-[var(--text-muted)]">See vertical →</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-32">
        <div className="surface-raised p-8">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">From pitch to wrap, on one platform</h2>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                Proposals that sync to clients. Advancing that routes to vendors. Tickets that scan on mobile.
                Finance that reconciles automatically. Every stakeholder in the right place at the right time.
              </p>
              <div className="mt-6">
                <Button href="/pricing" variant="secondary">See pricing →</Button>
              </div>
            </div>
            <ul className="space-y-3 text-sm">
              {[
                "Organization-scoped RLS on every table",
                "Stripe Connect payouts to vendors",
                "Signed file uploads with expiring URLs",
                "Offline ticket scanning with race-safe updates",
                "AI drafting trained on your own proposals",
                "Audit log across every mutation",
              ].map((x) => (
                <li key={x} className="flex items-center gap-2">
                  <span className="status-dot status-dot-success" />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
