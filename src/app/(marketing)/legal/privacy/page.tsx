export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-4 text-xs text-[var(--text-muted)]">Last updated: 2026-04-16</p>
      <div className="mt-8 space-y-6 text-sm text-[var(--text-secondary)]">
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">What we collect</h2>
          <p className="mt-2">Account info, workspace content you upload, and operational telemetry (pageviews, errors, API timing).</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">How we use it</h2>
          <p className="mt-2">To run the Service, prevent abuse, and improve reliability. We do not sell customer data.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">Subprocessors</h2>
          <p className="mt-2">Supabase (hosting + database), Stripe (billing), Anthropic (AI), Vercel (edge + CDN).</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">Retention</h2>
          <p className="mt-2">Default 90 days for audit logs; customer content retained until you delete it or your org is deleted.</p>
        </section>
      </div>
    </div>
  );
}
