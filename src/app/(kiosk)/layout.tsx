// T1-4 kiosk / shared-device punch mode — its own route group ON PURPOSE.
//
// The `(mobile)` layout is auth-gated by construction: no session renders the
// COMPVSS onboarding full-screen and children never mount. A kiosk tablet is
// the opposite contract — it NEVER carries a user session (its credential is
// the httpOnly device-token cookie), so its routes live in this sibling group
// under the same `/m` URL space (the compvss.* subdomain rewrite targets
// `/m/*`, so the kiosk must stay under it). The manager-gated setup/PIN pages
// below this group enforce their own sessions per-page.
//
// Same COMPVSS skin as the mobile shell (signal yellow, kit-mobile.css), no
// tab bar / drawer / personal chrome — a kiosk shows nobody's data at rest.
import "../theme/kit-mobile.css";

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-ui="saas"
      data-theme="atlvs-product"
      data-product="compvss"
      data-platform="compvss"
      className="page-shell mobile-shell"
    >
      <main id="main" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
