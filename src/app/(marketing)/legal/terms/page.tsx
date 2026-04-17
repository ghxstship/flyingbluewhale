export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
      <p className="mt-4 text-xs text-[var(--text-muted)]">Last updated: 2026-04-16</p>
      <div className="mt-8 space-y-6 text-sm text-[var(--text-secondary)]">
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">1. Acceptance of Terms</h2>
          <p className="mt-2">By accessing or using flyingbluewhale you agree to these Terms. If you do not agree, do not use the Service.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">2. Accounts</h2>
          <p className="mt-2">You are responsible for safeguarding the credentials used to access your account and for any activity under your account.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">3. Subscription & Billing</h2>
          <p className="mt-2">Paid plans are billed via Stripe. Taxes, cancellation, and refund policies are documented in your in-app billing settings.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">4. Data Ownership</h2>
          <p className="mt-2">You own the content you upload. We process it solely to provide the Service. Export at any time from Settings → Compliance.</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">5. Termination</h2>
          <p className="mt-2">Either party may terminate at any time. Your data remains exportable for 30 days post-termination.</p>
        </section>
      </div>
    </div>
  );
}
