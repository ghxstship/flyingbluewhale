export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // Theme lock — per v2 GHXSTSHIP handoff, "Sign in" lives in the SaaS
  // register (BRAND_ARCHITECTURE.md), not the marketing voice. Auth
  // surfaces paint with the neutral atlvs-product skin regardless of
  // the user's cosmic-marketing cookie pref. No data-platform here —
  // the theme's default accent (atlvs pink) is correct pre-session.
  return (
    <div data-ui="saas" data-theme="atlvs-product" data-product="atlvs" className="page-shell">
      {/* AX-1 — auth shell <main> landmark so the root skip link has a
          target. loading.tsx / not-found.tsx render <div> wrappers (not
          <main>) to avoid nesting landmarks inside this one. */}
      <main id="main" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
