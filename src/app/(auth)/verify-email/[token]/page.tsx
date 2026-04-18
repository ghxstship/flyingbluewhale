import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";

export default async function VerifyEmailPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <AuthShell
      title="Verify your email"
      subtitle="Confirming your account…"
      footer={
        <Link href="/login" className="text-[var(--org-primary)] underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      }
    >
      <div role="status" aria-live="polite" className="surface-raised space-y-3 p-4 text-sm text-[var(--text-secondary)]">
        <p>We&apos;re processing your verification link.</p>
        <p className="font-mono text-[10px] text-[var(--text-muted)]">token: {token.slice(0, 10)}…</p>
      </div>
    </AuthShell>
  );
}
