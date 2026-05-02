import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthShell } from "@/components/auth/AuthShell";
import { Alert } from "@/components/ui/Alert";

/**
 * Direct email-confirmation landing. Same pattern as /magic-link/[token] —
 * a fallback for legacy email templates that embed the token in the URL.
 * Supabase's modern flow uses /auth/callback?code=...
 */
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: "email",
  });

  if (!error) {
    redirect("/auth/resolve");
  }

  return (
    <AuthShell title="Verification failed" subtitle="We couldn't verify your email with that link.">
      <Alert kind="error">{error.message}</Alert>
      <p className="mt-4 text-sm text-[var(--text-secondary)]">
        Verification links expire after 24 hours. Request a fresh one from the verify-email page.
      </p>
      <Link href="/verify-email" className="btn btn-primary mt-4 w-full">
        Resend verification email
      </Link>
    </AuthShell>
  );
}
