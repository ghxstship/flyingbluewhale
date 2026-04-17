import { ModuleHeader } from "@/components/Shell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default function InvitesPage() {
  return (
    <>
      <ModuleHeader eyebrow="People" title="Invites" subtitle="Pending organization invitations" />
      <div className="page-content">
        <EmptyState
          title="No pending invites"
          description="Send a single invite from Settings > Organization, or bulk-import via CSV."
          action={<Button href="/console/settings/organization">Organization settings →</Button>}
        />
      </div>
    </>
  );
}
