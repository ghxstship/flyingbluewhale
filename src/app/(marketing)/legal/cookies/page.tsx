export const metadata = {
  title: "Cookie Policy — FLYTEHAUS Technologies",
};

export default function CookiePolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Cookie Policy</h1>
      <p className="mt-4 text-xs text-[var(--text-muted)]">Last updated: 2026-05-13</p>
      <div className="mt-8 space-y-6 text-sm text-[var(--text-secondary)]">
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">What Are Cookies</h2>
          <p className="mt-2">
            Cookies are small text files placed on your device by a website. We use them to keep you signed in, protect
            your session, and — only with your consent — to understand how the product is used.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">Cookies We Use</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Duration</th>
                  <th>Purpose</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>sb-*</code>
                  </td>
                  <td>Essential</td>
                  <td>Session / 1 week</td>
                  <td>Supabase authentication token and refresh token.</td>
                </tr>
                <tr>
                  <td>
                    <code>fh_consent</code>
                  </td>
                  <td>Essential</td>
                  <td>1 year</td>
                  <td>Stores your cookie consent preferences.</td>
                </tr>
                <tr>
                  <td>
                    <code>fh_locale</code>
                  </td>
                  <td>Essential</td>
                  <td>1 year</td>
                  <td>Stores your preferred language.</td>
                </tr>
                <tr>
                  <td>Analytics cookies</td>
                  <td>Analytics (optional)</td>
                  <td>Up to 2 years</td>
                  <td>
                    Aggregate usage statistics. Set only if you accept analytics cookies. We never sell or correlate
                    analytics data to individual identity.
                  </td>
                </tr>
                <tr>
                  <td>Marketing cookies</td>
                  <td>Marketing (optional)</td>
                  <td>Up to 90 days</td>
                  <td>
                    Conversion tracking on the marketing site only — not inside the product. Set only if you accept
                    marketing cookies.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">Your Choices</h2>
          <p className="mt-2">
            When you first visit flytehaus.studio you are presented with a consent banner where you can accept all, reject
            all, or customise which optional categories are enabled. You can change your preferences at any time by
            clearing the <code>fh_consent</code> cookie or revisiting the banner via your browser settings.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">Third-Party Cookies</h2>
          <p className="mt-2">
            We do not permit third-party advertising networks to set cookies on FLYTEHAUS properties. Subprocessors
            (Supabase, Stripe, Vercel) may set their own first-party cookies as part of service delivery.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-[var(--foreground)]">Contact</h2>
          <p className="mt-2">
            Questions about this policy? Email <a href="mailto:privacy@flytehaus.studio">privacy@flytehaus.studio</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
