export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // Theme lock — per v2 GHXSTSHIP handoff, "Sign in" lives in the SaaS
  // register (BRAND_ARCHITECTURE.md), not the marketing voice. Auth
  // surfaces paint with the neutral atlvs-product skin regardless of
  // the user's cosmic-marketing cookie pref. No data-platform here —
  // the theme's default accent (atlvs pink) is correct pre-session.
  return (
    <div data-theme="atlvs-product" className="page-shell">
      {children}
    </div>
  );
}
