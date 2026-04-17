import Link from "next/link";

const CASES = [
  { slug: "black-coffee-mmw26", name: "Black Coffee · MMW26", blurb: "Open Air at the Racetrack — 15K guests, 3 stages, 6-role KBYG rollout." },
  { slug: "live-events-inc", name: "Live Events Inc.", blurb: "Moved production ops to flyingbluewhale and cut invoicing cycle from 14 to 2 days." },
  { slug: "touring-agency", name: "Touring Agency", blurb: "40+ shows/year, unified advancing + artist portal for every artist on roster." },
];

export default function CustomersPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--org-primary)]">Customers</div>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Teams running on flyingbluewhale</h1>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CASES.map((c) => (
          <Link key={c.slug} href={`/customers/${c.slug}`} className="surface hover-lift p-5">
            <div className="text-sm font-semibold">{c.name}</div>
            <div className="mt-1 text-xs text-[var(--text-muted)]">{c.blurb}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
