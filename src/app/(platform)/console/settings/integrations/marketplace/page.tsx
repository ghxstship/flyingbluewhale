import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { KNOWN_CONNECTORS } from "../connectors";

export const dynamic = "force-dynamic";

const CATALOG: Array<{
  id: string;
  name: string;
  desc: string;
  category: string;
  available: boolean;
}> = [
  ...KNOWN_CONNECTORS.map((c) => ({
    id: c.id,
    name: c.name,
    desc: c.desc,
    category:
      c.id === "stripe" || c.id === "quickbooks"
        ? "Finance"
        : c.id === "slack"
          ? "Comms"
          : c.id === "google"
            ? "Identity"
            : c.id === "anthropic"
              ? "AI"
              : c.id === "clickup"
                ? "Tasks"
                : c.id === "hubspot"
                  ? "CRM"
                  : "Misc",
    available: true,
  })),
  // Coming-soon entries from KNOWN_CONNECTORS extension
  { id: "docusign", name: "DocuSign", desc: "Contract signature flow", category: "Legal", available: false },
  { id: "ironclad", name: "Ironclad", desc: "Contract lifecycle", category: "Legal", available: false },
  { id: "flexport", name: "Flexport", desc: "Freight + customs TMS", category: "Logistics", available: false },
  { id: "project44", name: "project44", desc: "Multimodal visibility", category: "Logistics", available: false },
  { id: "sap", name: "SAP", desc: "ERP / GL bridge", category: "Finance", available: false },
  { id: "workday", name: "Workday", desc: "HR + payroll", category: "HR", available: false },
];

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Settings" title="Integrations marketplace" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase.from("org_integrations").select("connector, status").eq("org_id", session.orgId);
  const installed = new Map((data ?? []).map((r) => [r.connector, r.status]));
  const installedCount = Array.from(installed.values()).filter((s) => s === "installed").length;

  // Group by category
  const categories = CATALOG.reduce<Map<string, typeof CATALOG>>((map, c) => {
    if (!map.has(c.category)) map.set(c.category, []);
    map.get(c.category)!.push(c);
    return map;
  }, new Map());

  const cats = Array.from(categories.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <>
      <ModuleHeader
        eyebrow="Settings"
        title="Integrations marketplace"
        subtitle={`${CATALOG.filter((c) => c.available).length} available · ${installedCount} installed · ${CATALOG.filter((c) => !c.available).length} coming soon`}
        action={
          <Button href="/console/settings/integrations" size="sm">
            Manage installed
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Available" value={CATALOG.filter((c) => c.available).length.toLocaleString()} accent />
          <MetricCard label="Installed" value={installedCount.toLocaleString()} />
          <MetricCard label="Coming soon" value={CATALOG.filter((c) => !c.available).length.toLocaleString()} />
        </div>

        {cats.map(([cat, items]) => (
          <section key={cat}>
            <h3 className="text-sm font-semibold">{cat}</h3>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((c) => {
                const status = installed.get(c.id);
                const isInstalled = status === "installed";
                return (
                  <div key={c.id} className="surface flex flex-col p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold">{c.name}</div>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">{c.desc}</p>
                      </div>
                      {isInstalled ? (
                        <Badge variant="success">Installed</Badge>
                      ) : c.available ? (
                        <Badge variant="muted">Available</Badge>
                      ) : (
                        <Badge variant="muted">Soon</Badge>
                      )}
                    </div>
                    <div className="mt-4">
                      {c.available ? (
                        <Link
                          href={isInstalled ? "/console/settings/integrations" : `/console/settings/integrations`}
                          className="btn btn-secondary btn-sm w-full"
                        >
                          {isInstalled ? "Manage" : "Install"}
                        </Link>
                      ) : (
                        <button className="btn btn-secondary btn-sm w-full" disabled>
                          Notify me
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
