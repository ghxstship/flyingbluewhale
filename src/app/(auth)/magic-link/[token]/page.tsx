import Link from "next/link";
import { AuthCard } from "@/components/Shell";

export default async function MagicLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <AuthCard title="Signing you in" subtitle="Validating your magic link">
      <p className="text-sm text-[var(--text-secondary)]">
        If you&apos;re not redirected automatically, <Link href="/login" className="text-[var(--org-primary)]">return to login</Link>.
      </p>
      <p className="mt-2 font-mono text-[10px] text-[var(--text-muted)]">token: {token.slice(0, 10)}…</p>
    </AuthCard>
  );
}
