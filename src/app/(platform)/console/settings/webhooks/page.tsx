import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

const EVENTS = [
  "project.created", "project.status_changed",
  "invoice.sent", "invoice.paid",
  "proposal.signed",
  "deliverable.submitted", "deliverable.approved",
  "ticket.scanned",
  "po.acknowledged", "po.fulfilled",
];

export default function WebhooksPage() {
  return (
    <>
      <ModuleHeader eyebrow="Settings" title="Webhooks" subtitle="Outgoing event notifications to your endpoints" />
      <div className="page-content space-y-4">
        <div className="surface p-5">
          <h3 className="text-sm font-semibold">Available events</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {EVENTS.map((e) => <Badge key={e} variant="muted"><span className="font-mono">{e}</span></Badge>)}
          </div>
        </div>
        <EmptyState
          title="No endpoints registered"
          description="Register your endpoint via the API or contact support. Payloads are HMAC-signed with your webhook secret."
        />
      </div>
    </>
  );
}
