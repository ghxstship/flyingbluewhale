export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--org-primary)]">About</div>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Built by operators, for operators</h1>
      <div className="mt-8 space-y-4 text-sm text-[var(--text-secondary)]">
        <p>flyingbluewhale is a production-operations platform shipped by GHXSTSHIP. We built it because every production team we worked with was duct-taping a dozen SaaS tools together and losing money in the seams.</p>
        <p>One platform. Three shells. Everyone on the same page — from proposal to wrap.</p>
      </div>
    </div>
  );
}
