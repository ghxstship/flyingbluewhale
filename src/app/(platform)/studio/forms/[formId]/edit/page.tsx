import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { Json } from "@/lib/supabase/database.types";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
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
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.forms.eyebrow", undefined, "Forms")}
          title={t("console.forms.edit.title", undefined, "Edit Form")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.forms.edit.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("form_defs")
    .select("id, title, slug, form_state, description, schema, updated_at")
    .eq("id", formId)
    .eq("org_id", session.orgId)
    .maybeSingle();

  if (!data) notFound();

  const form = data as {
    id: string;
    title: string;
    slug: string;
    form_state: string;
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
        eyebrow={t("console.forms.eyebrow", undefined, "Forms")}
        title={t("console.forms.edit.headerTitle", { title: form.title }, `Edit · ${form.title}`)}
        subtitle={t("console.forms.edit.subtitle", undefined, "Update title, slug, status, and the JSON schema.")}
        breadcrumbs={[
          { label: t("console.forms.eyebrow", undefined, "Forms"), href: "/studio/forms" },
          { label: form.title, href: `/studio/forms/${form.id}` },
          { label: t("console.forms.edit.breadcrumb", undefined, "Edit") },
        ]}
      />
      <div className="page-content max-w-3xl">
        <FormShell
          action={updateFormDefAction}
          cancelHref={`/studio/forms/${form.id}`}
          submitLabel={t("console.forms.edit.submit", undefined, "Save Form")}
          dirtyGuard
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={form.updated_at} />
          <input type="hidden" name="formId" value={form.id} />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label={t("console.forms.edit.fields.title", undefined, "Title")}
              name="title"
              defaultValue={form.title}
              required
              maxLength={200}
            />
            <Input
              label={t("console.forms.edit.fields.slug", undefined, "Slug")}
              name="slug"
              defaultValue={form.slug}
              required
              maxLength={120}
              hint={t(
                "console.forms.edit.fields.slugHint",
                undefined,
                "Lowercase, dashes ok. Public form lives at /forms/<slug>.",
              )}
            />
          </div>

          <div>
            <label htmlFor="description" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.forms.edit.fields.description", undefined, "Description")}
            </label>
            <textarea id="description"
              name="description"
              defaultValue={form.description ?? ""}
              rows={3}
              maxLength={2000}
              className="ps-input mt-1.5 w-full"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.forms.edit.fields.form_state", undefined, "Status")}
            </label>
            <div className="mt-1.5 grid grid-cols-3 gap-1.5">
              {(["draft", "published", "archived"] as const).map((s) => (
                <label key={s} className="surface hover-lift flex cursor-pointer items-center gap-2 px-3 py-2 text-sm">
                  <input
                    type="radio"
                    name="form_state"
                    value={s}
                    defaultChecked={form.form_state === s}
                    className="accent-[var(--p-accent)]"
                  />
                  {toTitle(s)}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="schema_json" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.forms.edit.fields.schemaJson", undefined, "Schema (JSON)")}{" "}
              <span className="text-[var(--p-danger)]">*</span>
            </label>
            <textarea id="schema_json"
              name="schema_json"
              defaultValue={schemaText}
              rows={20}
              required
              spellCheck={false}
              className="ps-input mt-1.5 w-full font-mono text-xs"
            />
            <p className="mt-1 text-[11px] text-[var(--p-text-2)]">
              {t("console.forms.edit.fields.schemaShapeLabel", undefined, "Shape:")}{" "}
              <code>{`{ "fields": [{ "key", "label", "type", "required"?, "placeholder"?, "options"? }] }`}</code>.{" "}
              {t(
                "console.forms.edit.fields.schemaFieldTypes",
                undefined,
                "Field types: text, textarea, email, url, number, date, select, checkbox.",
              )}
            </p>
          </div>
        </FormShell>
      </div>
    </>
  );
}
