import Link from "next/link";

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="text-xs font-semibold tracking-[0.25em] text-[var(--org-primary)] uppercase">Customers</div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Production Teams Running on L0ST 1SLAND</h1>
      <p className="mt-4 text-sm text-[var(--text-secondary)]">
        Case studies are in production with our launch partners and will land here through Q3. For an under-NDA preview
        tailored to your event format, talk to us directly.
      </p>
      <div className="mt-8 flex items-center gap-3">
        <Link href="/contact" className="btn btn-primary">
          Book a brief
        </Link>
        <Link href="/community" className="btn btn-secondary">
          See production teams in the community
        </Link>
      </div>

      <p className="mt-12 text-xs text-[var(--text-muted)]">
        Want to be a launch partner? Send a one-paragraph note about your upcoming event window and the operational
        shape (residency / touring run / festival / governing-body event) from the contact form above.
      </p>
    </div>
  );
}
