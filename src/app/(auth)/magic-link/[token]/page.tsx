import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";

export default async function MagicLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <AuthShell
      title="Signing you in"
      subtitle="Validating your magic link…"
      footer={
        <Link href="/login" className="text-[var(--org-primary)] underline underline-offset-4">
          Back to sign in
        </Link>
      }
    >
      <div role="status" aria-live="polite" className="surface-raised p-4 text-sm text-[var(--text-secondary)]">
        If you&apos;re not redirected automatically within a few seconds, your link may have expired.
      </div>
      <p className="mt-3 font-mono text-[10px] text-[var(--text-muted)]">token: {token.slice(0, 10)}…</p>
    </AuthShell>
  );
}
