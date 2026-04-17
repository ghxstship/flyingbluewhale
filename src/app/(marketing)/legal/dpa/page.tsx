export default function DpaPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Data Processing Addendum</h1>
      <p className="mt-4 text-xs text-[var(--text-muted)]">Last updated: 2026-04-16</p>
      <div className="mt-8 space-y-4 text-sm text-[var(--text-secondary)]">
        <p>Our DPA incorporates the EU SCCs and UK IDTA. It auto-applies when you subscribe. Request a counter-signed copy from Settings → Compliance.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Roles: you are the Controller; we are the Processor.</li>
          <li>Subprocessors: Supabase, Stripe, Anthropic, Vercel.</li>
          <li>Breach notification: within 48 hours of confirmation.</li>
          <li>Data transfers: SCCs + UK IDTA where applicable.</li>
        </ul>
      </div>
    </div>
  );
}
