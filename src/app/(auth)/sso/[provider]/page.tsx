import Link from "next/link";
import { AuthCard } from "@/components/Shell";

export default async function SsoPage({ params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  return (
    <AuthCard title={`Sign in with ${provider}`} subtitle="Redirecting to your identity provider…">
      <p className="text-sm text-[var(--text-secondary)]">
        If you&apos;re not redirected, <Link href="/login" className="text-[var(--org-primary)]">return to login</Link>.
      </p>
    </AuthCard>
  );
}
