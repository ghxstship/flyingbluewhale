import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { Json } from "@/lib/supabase/database.types";
import { toTitle } from "@/lib/format";
import { updateFormDefAction } from "./actions";

export const dynamic = "force-dynamic";

const STARTER_SCHEMA: Json = {
  fields: [
    { key: "name", label: "Name", type: "text", required: true },
    { key: "email", label: "Email", type: "email", required: true },
    { key: "message", label: "Message", type: "textarea", required: false },
  ],
};

export default async function Page({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Forms" title="Edit Form" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("form_defs")
    .select("id, title, slug, status, description, schema, updated_at")
    .eq("id", formId)
    .eq("org_id", session.orgId)
    .maybeSingle();

  if (!data) notFound();

  const form = data as {
    id: string;
    title: string;
    slug: string;
    status: string;
    description: string | null;
    schema: Json;
    updated_at: string;
  };
  const schemaText = JSON.stringify(
    form.schema && Object.keys(form.schema as object).length > 0 ? form.schema : STARTER_SCHEMA,
    null,
    2,
  );

  return (
    <>
      <ModuleHeader
        eyebrow="Forms"
        title={`Edit · ${form.title}`}
        subtitle="Update title, slug, status, and the JSON schema."
        breadcrumbs={[
          { label: "Forms", href: "/console/forms" },
          { label: form.title, href: `/console/forms/${form.id}` },
          { label: "Edit" },
        ]}
      />
      <div className="page-content max-w-3xl">
        <FormShell
          action={updateFormDefAction}
          cancelHref={`/console/forms/${form.id}`}
          submitLabel="Save Form"
          dirtyGuard
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={form.updated_at} />
          <input type="hidden" name="formId" value={form.id} />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="Title" name="title" defaultValue={form.title} required maxLength={200} />
            <Input
              label="Slug"
              name="slug"
              defaultValue={form.slug}
              required
              maxLength={120}
              hint="Lowercase, dashes ok. Public form lives at /forms/<slug>."
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Description</label>
            <textarea
              name="description"
              defaultValue={form.description ?? ""}
              rows={3}
              maxLength={2000}
              className="input-base mt-1.5 w-full"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Status</label>
            <div className="mt-1.5 grid grid-cols-3 gap-1.5">
              {(["draft", "published", "archived"] as const).map((s) => (
                <label key={s} className="surface hover-lift flex cursor-pointer items-center gap-2 px-3 py-2 text-sm">
                  <input
                    type="radio"
                    name="status"
                    value={s}
                    defaultChecked={form.status === s}
                    className="accent-[var(--org-primary)]"
                  />
                  {toTitle(s)}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              Schema (JSON) <span className="text-[var(--color-error)]">*</span>
            </label>
            <textarea
              name="schema_json"
              defaultValue={schemaText}
              rows={20}
              required
              spellCheck={false}
              className="input-base mt-1.5 w-full font-mono text-xs"
            />
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">
              Shape:{" "}
              <code>{`{ "fields": [{ "key", "label", "type", "required"?, "placeholder"?, "options"? }] }`}</code>.
              Field types: text, textarea, email, url, number, date, select, checkbox.
            </p>
          </div>
        </FormShell>
      </div>
    </>
  );
}
