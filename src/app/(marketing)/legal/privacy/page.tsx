export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="hed-xl">Privacy Policy</h1>
      <p className="mt-4 text-xs text-[var(--p-text-2)]">Last updated: 2026-04-16</p>
      <div className="mt-8 space-y-6 text-sm text-[var(--p-text-2)]">
        <section>
          <h2 className="text-base font-semibold text-[var(--p-text-1)]">What We Collect</h2>
          <p className="mt-2">
            Account info, workspace content you upload, and operational telemetry (pageviews, errors, API timing).
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-[var(--p-text-1)]">How We Use It</h2>
          <p className="mt-2">
            To run the Service, prevent abuse, and improve reliability. We do not sell customer data.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-[var(--p-text-1)]">Subprocessors</h2>
          <p className="mt-2">Supabase (hosting + database), Stripe (billing), Anthropic (AI), Vercel (edge + CDN).</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-[var(--p-text-1)]">Retention</h2>
          <p className="mt-2">
            Default 90 days for audit logs; customer content retained until you delete it or your org is deleted.
          </p>
        </section>
      </div>
    </div>
  );
}
