import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import type { Json } from "@/lib/supabase/database.types";

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
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function Page({ params }: { params: Promise<{ integrationId: string }> }) {
  const { integrationId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.settings.integrations.detail.eyebrow", undefined, "Settings")}
          title={t("console.settings.integrations.detail.title", undefined, "Integration")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.settings.integrations.detail.configureSupabase", undefined, "Configure Supabase.")}
          </div>
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
        eyebrow={t("console.settings.integrations.detail.eyebrow", undefined, "Settings")}
        title={integration.name}
        subtitle={
          <span className="font-mono text-xs">
            /{integration.slug} · {kindLabel} ·{" "}
            {t(
              "console.settings.integrations.detail.updatedAt",
              { date: fmt(integration.updated_at) },
              `updated ${fmt(integration.updated_at)}`,
            )}
          </span>
        }
        breadcrumbs={[
          { label: t("console.settings.breadcrumb", undefined, "Settings"), href: "/studio/settings" },
          {
            label: t("console.settings.integrations.breadcrumb", undefined, "Integrations"),
            href: "/studio/settings/integrations",
          },
          { label: integration.name },
        ]}
        action={
          <Badge variant={integration.enabled ? "success" : "muted"}>
            {integration.enabled
              ? t("console.settings.integrations.detail.enabled", undefined, "Enabled")
              : t("console.settings.integrations.detail.disabled", undefined, "Disabled")}
          </Badge>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.settings.integrations.detail.kindLabel", undefined, "Kind")}
            value={kindLabel}
          />
          <MetricCard
            label={t("console.settings.integrations.detail.statusLabel", undefined, "Status")}
            value={
              integration.enabled
                ? t("console.settings.integrations.detail.enabled", undefined, "Enabled")
                : t("console.settings.integrations.detail.disabled", undefined, "Disabled")
            }
            accent={integration.enabled}
          />
          <MetricCard
            label={t("console.settings.integrations.detail.createdLabel", undefined, "Created")}
            value={integration.created_at.slice(0, 10)}
          />
        </div>

        <section className="surface p-4">
          <h3 className="text-sm font-semibold">
            {t("console.settings.integrations.detail.configurationHeading", undefined, "Configuration")}
          </h3>
          <p className="mt-1 text-xs text-[var(--p-text-2)]">
            {t(
              "console.settings.integrations.detail.configurationDescription",
              undefined,
              "Public configuration values for this connector. Secrets are stored separately in Vault.",
            )}
          </p>
          <pre className="mt-3 max-h-96 overflow-auto rounded bg-[var(--p-surface)] p-3 font-mono text-xs">
            {JSON.stringify(integration.config, null, 2)}
          </pre>
          {integration.secret_ref && (
            <div className="mt-3 text-xs">
              <span className="text-[var(--p-text-2)]">
                {t("console.settings.integrations.detail.secretRefLabel", undefined, "Secret ref:")}{" "}
              </span>
              <code className="font-mono">{integration.secret_ref}</code>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
