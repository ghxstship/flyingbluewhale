import Link from 'next/link';

const MARKETING_NAV = [
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--brand-color)] [box-shadow:var(--brand-shadow)]" />
            <span className="text-heading text-sm tracking-[0.2em] text-text-primary">GVTEWAY</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {MARKETING_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn btn-ghost text-sm">Log In</Link>
            <Link href="/signup" className="btn btn-primary text-sm">Get Started</Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-border py-12 mt-16">
        <div className="max-w-7xl mx-auto px-6 text-center text-text-disabled text-xs">
          © {new Date().getFullYear()} GVTEWAY. All rights reserved.
          <div className="mt-2 flex justify-center gap-4">
            <Link href="/legal/terms" className="hover:text-text-secondary transition-colors">Terms</Link>
            <Link href="/legal/privacy" className="hover:text-text-secondary transition-colors">Privacy</Link>
            <Link href="/legal/sla" className="hover:text-text-secondary transition-colors">SLA</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
