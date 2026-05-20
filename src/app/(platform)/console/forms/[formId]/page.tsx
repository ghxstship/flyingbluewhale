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
import { getRequestFormatters } from "@/lib/i18n/request";

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

const STATUS_TONE: Record<string, "muted" | "success" | "warning" | "info"> = {
  draft: "muted",
  published: "success",
  archived: "warning",
};

function fieldCount(schema: Json): number {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) return 0;
  const fields = (schema as { fields?: unknown }).fields;
  return Array.isArray(fields) ? fields.length : 0;
}

export default async function Page({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Forms" title="Form" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmtIntl = await getRequestFormatters();
  const fmt = (iso: string) => fmtIntl.dateTime(iso);
  const { data } = await supabase
    .from("form_defs")
    .select("id, title, slug, status, description, schema, created_at, updated_at")
    .eq("id", formId)
    .eq("org_id", session.orgId)
    .maybeSingle();

  const form = data as unknown as FormDefRow | null;
  if (!form) notFound();

  const fields = fieldCount(form.schema);
  const tone = STATUS_TONE[form.status] ?? "muted";

  return (
    <>
      <ModuleHeader
        eyebrow="Forms"
        title={form.title}
        subtitle={
          <span className="font-mono text-xs">
            /{form.slug} · updated {fmt(form.updated_at)}
          </span>
        }
        breadcrumbs={[{ label: "Forms", href: "/console/forms" }, { label: form.title }]}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={tone}>{form.status}</Badge>
            <Button href={`/console/forms/${form.id}/edit`} variant="secondary" size="sm">
              Edit
            </Button>
          </div>
        }
      />
      <div className="page-content space-y-5">
        {form.description && <p className="text-sm text-[var(--text-secondary)]">{form.description}</p>}

        <div className="metric-grid-3">
          <MetricCard label="Fields" value={fmtIntl.number(fields)} />
          <MetricCard label="Status" value={form.status} />
          <MetricCard label="Created" value={form.created_at.slice(0, 10)} />
        </div>

        <section className="surface p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Public Response URL</h3>
            <Link
              href={`/forms/${form.slug}`}
              target="_blank"
              rel="noopener"
              className="text-xs text-[var(--org-primary)]"
            >
              Open ↗
            </Link>
          </div>
          <code className="mt-2 block rounded bg-[var(--bg-secondary)] p-2 font-mono text-xs break-all">
            /forms/{form.slug}
          </code>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Share this URL to collect submissions. Authoring lives in the editor — schema is stored as JSON.
          </p>
        </section>

        <section className="surface p-4">
          <h3 className="text-sm font-semibold">Schema</h3>
          {fields === 0 ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              No fields defined yet. Open the editor to add fields.
            </p>
          ) : (
            <pre className="mt-3 max-h-96 overflow-auto rounded bg-[var(--bg-secondary)] p-3 font-mono text-xs">
              {JSON.stringify(form.schema, null, 2)}
            </pre>
          )}
        </section>
      </div>
    </>
  );
}
