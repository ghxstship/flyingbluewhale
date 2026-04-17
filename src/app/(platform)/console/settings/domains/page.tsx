import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

export default function DomainsPage() {
  return (
    <>
      <ModuleHeader eyebrow="Settings" title="Custom domains" subtitle="Serve portals from your own domain" />
      <div className="page-content space-y-4">
        <div className="surface p-5">
          <div className="text-sm font-semibold">Default domains</div>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs">marketing.flyingbluewhale.app</span>
              <Badge variant="success">Live</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs">app.flyingbluewhale.app</span>
              <Badge variant="success">Live</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs">portal.flyingbluewhale.app</span>
              <Badge variant="success">Live</Badge>
            </div>
          </div>
        </div>
        <EmptyState
          title="Add your domain"
          description="Point a CNAME to ingress.flyingbluewhale.app and we issue a TLS cert automatically. Available on Professional and Enterprise."
        />
      </div>
    </>
  );
}
