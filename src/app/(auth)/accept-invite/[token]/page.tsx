import { AuthCard } from "@/components/Shell";
import { Button } from "@/components/ui/Button";

export default async function AcceptInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <AuthCard title="Join your team" subtitle="Accept your invitation to flyingbluewhale">
      <p className="text-sm text-[var(--text-secondary)]">
        You&apos;ve been invited to a flyingbluewhale workspace. Accept below and we&apos;ll take you straight in.
      </p>
      <form action="/auth/resolve" method="post" className="mt-4">
        <input type="hidden" name="invite_token" value={token} />
        <Button type="submit" size="lg" className="w-full">Accept invite</Button>
      </form>
    </AuthCard>
  );
}
