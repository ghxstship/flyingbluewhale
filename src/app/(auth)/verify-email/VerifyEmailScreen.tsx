"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { resendVerificationAction } from "../actions";
import type { FormState } from "@/components/FormShell";

export function VerifyEmailScreen({ email }: { email?: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(resendVerificationAction, null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (state?.ok) {
      toast.success("Verification email resent.");
      setCooldown(60);
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  return (
    <AuthShell
      title="Check your inbox"
      subtitle={email ? `We sent a verification link to ${email}.` : "We sent a verification link to your email."}
      footer={
        <Link href="/login" className="text-[var(--org-primary)] underline underline-offset-4">
          Back to sign in
        </Link>
      }
    >
      <div className="space-y-4">
        <Alert kind="info">
          Click the link in the email to activate your account. The link expires in 24 hours.
        </Alert>
        <p className="text-sm text-[var(--text-secondary)]">
          Didn&apos;t get it? Check your spam folder, then request a new one below.
        </p>
        <form action={formAction}>
          {email && <input type="hidden" name="email" value={email} />}
          <Button
            type="submit"
            variant="ghost"
            className="w-full"
            loading={pending}
            disabled={pending || cooldown > 0 || !email}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : pending ? "Sending…" : "Resend verification email"}
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
