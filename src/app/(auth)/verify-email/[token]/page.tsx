import Link from "next/link";
import { AuthCard } from "@/components/Shell";

export default async function VerifyEmailPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <AuthCard title="Verify email" subtitle="Confirming your account">
      <div className="space-y-3 text-sm text-[var(--text-secondary)]">
        <p>We&apos;re processing your verification link. Token <code className="font-mono text-xs">{token.slice(0, 10)}…</code></p>
        <p>If you were redirected here by mistake, <Link href="/login" className="text-[var(--org-primary)]">return to login</Link>.</p>
      </div>
    </AuthCard>
  );
}
