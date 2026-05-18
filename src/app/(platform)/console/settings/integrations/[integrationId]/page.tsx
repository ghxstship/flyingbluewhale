import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { Json } from "@/lib/supabase/database.types";
import { formatDateParts } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

type IntegrationRow = {
  id: string;
  name: string;
  slug: string;
  kind: string;
  enabled: boolean;
  config: Json;
  secret_ref: string | null;
  created_at: string;
  updated_at: string;
};

const KIND_LABEL: Record<string, string> = {
  webhook: "Webhook",
  api_key: "API key",
  oauth: "OAuth",
  smtp: "SMTP",
  sms: "SMS",
  storage: "Storage",
  payments: "Payments",
  analytics: "Analytics",
  ats: "ATS",
  hris: "HRIS",
};

function fmt(iso: string): string {
  return formatDateParts(iso, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", });
}

export default async function Page({ params }: { params: Promise<{ integrationId: string }> }) {
  const { integrationId } = await params;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Settings" title="Integration" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("integration_connectors")
    .select("id, name, slug, kind, enabled, config, secret_ref, created_at, updated_at")
    .eq("id", integrationId)
    .eq("org_id", session.orgId)
    .maybeSingle();

  const integration = data as unknown as IntegrationRow | null;
  if (!integration) notFound();

  const kindLabel = KIND_LABEL[integration.kind] ?? integration.kind;

  return (
    <>
      <ModuleHeader
        eyebrow="Settings"
        title={integration.name}
        subtitle={
          <span className="font-mono text-xs">
            /{integration.slug} · {kindLabel} · updated {fmt(integration.updated_at)}
          </span>
        }
        breadcrumbs={[
          { label: "Settings", href: "/console/settings" },
          { label: "Integrations", href: "/console/settings/integrations" },
          { label: integration.name },
        ]}
        action={
          <Badge variant={integration.enabled ? "success" : "muted"}>
            {integration.enabled ? "Enabled" : "Disabled"}
          </Badge>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Kind" value={kindLabel} />
          <MetricCard
            label="Status"
            value={integration.enabled ? "Enabled" : "Disabled"}
            accent={integration.enabled}
          />
          <MetricCard label="Created" value={integration.created_at.slice(0, 10)} />
        </div>

        <section className="surface p-4">
          <h3 className="text-sm font-semibold">Configuration</h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Public configuration values for this connector. Secrets are stored in Vault under <code>secret_ref</code>.
          </p>
          <pre className="mt-3 max-h-96 overflow-auto rounded bg-[var(--bg-secondary)] p-3 font-mono text-xs">
            {JSON.stringify(integration.config, null, 2)}
          </pre>
          {integration.secret_ref && (
            <div className="mt-3 text-xs">
              <span className="text-[var(--text-muted)]">Secret ref: </span>
              <code className="font-mono">{integration.secret_ref}</code>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
