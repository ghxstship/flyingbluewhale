import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";

export default async function AcceptInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <AuthShell
      title="Join your team"
      subtitle="Accept your invitation to flyingbluewhale"
      footer={
        <Link href="/login" className="text-[var(--org-primary)] underline-offset-4 hover:underline">
          Sign in instead
        </Link>
      }
    >
      <p className="text-sm text-[var(--text-secondary)]">
        You&apos;ve been invited to a flyingbluewhale workspace. Accept below and we&apos;ll take you straight in.
      </p>
      <form action="/auth/resolve" method="post" className="mt-6">
        <input type="hidden" name="invite_token" value={token} />
        <Button type="submit" size="lg" className="w-full">
          Accept invite
        </Button>
      </form>
    </AuthShell>
  );
}
