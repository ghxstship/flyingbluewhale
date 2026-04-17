import Link from "next/link";
import { AuthCard } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <AuthCard title="Set a new password" subtitle="Use this token to reset your password.">
      <form className="space-y-4" method="post" action="/auth/resolve">
        <input type="hidden" name="token" value={token} />
        <Input label="New password" name="password" type="password" minLength={8} required autoComplete="new-password" />
        <Input label="Confirm" name="password_confirm" type="password" minLength={8} required autoComplete="new-password" />
        <Button type="submit" size="lg" className="w-full">Update password</Button>
      </form>
      <div className="mt-4 text-center text-xs">
        <Link href="/login" className="text-[var(--text-muted)]">Back to login</Link>
      </div>
    </AuthCard>
  );
}
