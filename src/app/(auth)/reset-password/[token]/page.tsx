import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { PasswordField } from "@/components/auth/PasswordField";

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <AuthShell
      title="Set a new password"
      subtitle="Use this token to reset your password."
      footer={
        <Link href="/login" className="text-[var(--org-primary)] underline underline-offset-4">
          Back to sign in
        </Link>
      }
    >
      <form className="space-y-4" method="post" action="/auth/resolve" noValidate>
        <input type="hidden" name="token" value={token} />
        <PasswordField
          name="password"
          label="New password"
          required
          minLength={8}
          autoComplete="new-password"
          showStrength
          hint="At least 8 characters"
        />
        <PasswordField
          name="password_confirm"
          label="Confirm password"
          required
          minLength={8}
          autoComplete="new-password"
        />
        <Button type="submit" size="lg" className="w-full">
          Update password
        </Button>
      </form>
    </AuthShell>
  );
}
