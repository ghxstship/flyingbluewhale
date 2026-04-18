import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";

export default async function SsoPage({ params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  return (
    <AuthShell
      title={`Sign in with ${provider}`}
      subtitle="Redirecting to your identity provider…"
      footer={
        <Link href="/login" className="text-[var(--org-primary)] underline underline-offset-4">
          Back to sign in
        </Link>
      }
    >
      <div role="status" aria-live="polite" className="surface-raised p-4 text-sm text-[var(--text-secondary)]">
        If you&apos;re not redirected automatically, your provider may not be configured. Try a different sign-in method.
      </div>
    </AuthShell>
  );
}
