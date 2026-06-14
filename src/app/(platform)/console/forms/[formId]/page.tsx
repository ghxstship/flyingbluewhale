import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { Json } from "@/lib/supabase/database.types";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { toneFor } from "@/lib/tones";

export const dynamic = "force-dynamic";

type FormDefRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  description: string | null;
  schema: Json;
  created_at: string;
  updated_at: string;
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

function fieldCount(schema: Json): number {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) return 0;
  const fields = (schema as { fields?: unknown }).fields;
  return Array.isArray(fields) ? fields.length : 0;
}

export default async function Page({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.forms.eyebrow", undefined, "Forms")}
          title={t("console.forms.detail.fallbackTitle", undefined, "Form")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.forms.detail.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmtIntl = await getRequestFormatters();
  const { data } = await supabase
    .from("form_defs")
    .select("id, title, slug, form_state, description, schema, created_at, updated_at")
    .eq("id", formId)
    .eq("org_id", session.orgId)
    .maybeSingle();

  const form = data as unknown as FormDefRow | null;
  if (!form) notFound();

  const fields = fieldCount(form.schema);
  const tone = toneFor(form.status);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.forms.eyebrow", undefined, "Forms")}
        title={form.title}
        subtitle={
          <span className="font-mono text-xs">
            /{form.slug} ·{" "}
            {t("console.forms.detail.updatedAt", { date: fmt(form.updated_at) }, `updated ${fmt(form.updated_at)}`)}
          </span>
        }
        breadcrumbs={[
          { label: t("console.forms.eyebrow", undefined, "Forms"), href: "/console/forms" },
          { label: form.title },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={tone}>{toTitle(form.status)}</Badge>
            <Button href={`/console/forms/${form.id}/submissions`} variant="secondary" size="sm">
              {t("console.forms.detail.viewSubmissions", undefined, "Submissions")}
            </Button>
            <Button href={`/console/forms/${form.id}/edit`} variant="secondary" size="sm">
              {t("common.edit", undefined, "Edit")}
            </Button>
          </div>
        }
      />
      <div className="page-content space-y-5">
        {form.description && <p className="text-sm text-[var(--p-text-2)]">{form.description}</p>}

        <div className="metric-grid-3">
          <MetricCard
            label={t("console.forms.detail.metric.fields", undefined, "Fields")}
            value={fmtIntl.number(fields)}
          />
          <MetricCard label={t("console.forms.detail.metric.status", undefined, "Status")} value={form.status} />
          <MetricCard
            label={t("console.forms.detail.metric.created", undefined, "Created")}
            value={form.created_at.slice(0, 10)}
          />
        </div>

        <section className="surface p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              {t("console.forms.detail.publicResponseUrl", undefined, "Public Response URL")}
            </h3>
            <Link
              href={`/forms/${form.slug}`}
              target="_blank"
              rel="noopener"
              className="text-xs text-[var(--p-accent)]"
            >
              {t("console.forms.detail.openLink", undefined, "Open ↗")}
            </Link>
          </div>
          <code className="mt-2 block rounded bg-[var(--p-surface)] p-2 font-mono text-xs break-all">
            /forms/{form.slug}
          </code>
          <p className="mt-2 text-xs text-[var(--p-text-2)]">
            {t(
              "console.forms.detail.shareUrlHint",
              undefined,
              "Share this URL to collect submissions. Authoring lives in the editor — schema is stored as JSON.",
            )}
          </p>
        </section>

        <section className="surface p-4">
          <h3 className="text-sm font-semibold">{t("console.forms.detail.schemaHeading", undefined, "Schema")}</h3>
          {fields === 0 ? (
            <p className="mt-2 text-xs text-[var(--p-text-2)]">
              {t("console.forms.detail.noFields", undefined, "No fields defined yet. Open the editor to add fields.")}
            </p>
          ) : (
            <pre className="mt-3 max-h-96 overflow-auto rounded bg-[var(--p-surface)] p-3 font-mono text-xs">
              {JSON.stringify(form.schema, null, 2)}
            </pre>
          )}
        </section>
      </div>
    </>
  );
}
