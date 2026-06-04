"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { resendVerificationAction } from "../actions";
import type { FormState } from "@/components/FormShell";
import { useT } from "@/lib/i18n/LocaleProvider";

export function VerifyEmailScreen({ email }: { email?: string }) {
  const t = useT();
  const [state, formAction, pending] = useActionState<FormState, FormData>(resendVerificationAction, null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (state?.ok) {
      toast.success(t("auth.verifyEmail.resendSuccess", undefined, "Verification email resent."));
      setCooldown(60);
    } else if (state?.error) {
      toast.error(state.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const tid = setTimeout(() => setCooldown((v) => v - 1), 1000);
    return () => clearTimeout(tid);
  }, [cooldown]);

  return (
    <AuthShell
      title={t("auth.verifyEmail.title", undefined, "Check your inbox")}
      subtitle={
        email
          ? t("auth.verifyEmail.subtitleWithEmail", { email }, `We sent a verification link to ${email}.`)
          : t("auth.verifyEmail.subtitleGeneric", undefined, "We sent a verification link to your email.")
      }
      footer={
        <Link href="/login" className="text-[var(--org-primary)] underline underline-offset-4">
          {t("auth.verifyEmail.backToLogin", undefined, "Back to sign in")}
        </Link>
      }
    >
      <div className="space-y-4">
        <Alert kind="info">
          {t(
            "auth.verifyEmail.info",
            undefined,
            "Click the link in the email to activate your account. The link expires in 24 hours.",
          )}
        </Alert>
        <p className="text-sm text-[var(--text-secondary)]">
          {t(
            "auth.verifyEmail.didntGetIt",
            undefined,
            "Didn't get it? Check your spam folder, then request a new one below.",
          )}
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
            {cooldown > 0
              ? t("auth.verifyEmail.resendCooldown", { seconds: cooldown }, `Resend in ${cooldown}s`)
              : pending
                ? t("auth.verifyEmail.resendSending", undefined, "Sending…")
                : t("auth.verifyEmail.resend", undefined, "Resend verification email")}
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
