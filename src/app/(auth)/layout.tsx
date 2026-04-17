import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-shell">
      <div className="mx-auto max-w-6xl px-6 py-6">
        <Link href="/" className="text-sm font-semibold tracking-tight text-[var(--foreground)]">
          flyingbluewhale
        </Link>
      </div>
      <main>{children}</main>
    </div>
  );
}
