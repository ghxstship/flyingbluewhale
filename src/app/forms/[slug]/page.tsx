import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import { EmptyState } from "@/components/ui/EmptyState";
import { coerceFormSchema } from "@/lib/forms/types";
import { PublicFormRenderer } from "@/components/forms/PublicFormRenderer";
import { PublicFormSubmit, type PublicFormField } from "./PublicFormSubmit";
import { submitFormAction } from "./actions";

export const dynamic = "force-dynamic";

type FormDef = {
  id: string;
  org_id: string;
  slug: string;
  title: string;
  description: string | null;
  status: string;
  schema: Json;
};

function legacyFieldsFromSchema(schema: Json): PublicFormField[] {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) return [];
  const fields = (schema as { fields?: unknown }).fields;
  if (!Array.isArray(fields)) return [];
  return fields
    .filter((f): f is Record<string, unknown> => typeof f === "object" && f !== null)
    .map((f) => ({
      key: String(f.key ?? ""),
      label: String(f.label ?? ""),
      type: (f.type as PublicFormField["type"]) ?? "text",
      required: Boolean(f.required),
      placeholder: typeof f.placeholder === "string" ? f.placeholder : undefined,
      options: Array.isArray(f.options) ? (f.options as string[]) : undefined,
    }))
    .filter((f) => f.key && f.label);
}

async function loadForm(slug: string): Promise<FormDef | null> {
  if (!isServiceClientAvailable()) return null;
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("form_defs")
    .select("id, org_id, slug, title, description, form_state, schema")
    .eq("slug", slug)
    .eq("form_state", "published")
    .maybeSingle();
  return (data as FormDef | null) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const form = await loadForm(slug);
  if (!form) return { title: "Form not found" };
  return {
    title: form.title,
    description: form.description ?? `Submit a response to ${form.title}.`,
    robots: { index: false, follow: false },
  };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const form = await loadForm(slug);
  if (!form) notFound();

  const schema = coerceFormSchema(form.schema);
  const embed = sp.embed === "1" || sp.header === "false";
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  // Build prefill record from URL searchParams (string values only).
  const prefill: Record<string, string> = {};
  for (const [key, value] of Object.entries(sp)) {
    if (typeof value === "string") prefill[key] = value;
  }

  // Render path:
  //   v2 (or any schema with sections / antiSpam / submit / payment) → PublicFormRenderer
  //   v1 plain fields → legacy PublicFormSubmit (unchanged)
  const useV2 =
    schema.version === 2 ||
    Boolean(schema.sections?.length) ||
    Boolean(schema.antiSpam?.captcha) ||
    Boolean(schema.submit?.redirectUrl);

  return (
    <main className={`mx-auto max-w-2xl px-6 ${embed ? "py-4" : "py-12 sm:py-16"}`}>
      {!embed && (
        <header className="mb-8">
          <div className="text-xs font-semibold tracking-wider text-[var(--p-accent)] uppercase">Form</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{form.title}</h1>
          {form.description && <p className="mt-3 text-sm text-[var(--p-text-2)]">{form.description}</p>}
        </header>
      )}

      {schema.fields.length === 0 ? (
        <EmptyState title="No fields yet" description="This form is being prepared. Check back soon." />
      ) : useV2 ? (
        <PublicFormRenderer
          slug={slug}
          schema={schema}
          prefill={prefill}
          submitAction={submitFormAction}
          turnstileSiteKey={turnstileSiteKey}
          embed={embed}
        />
      ) : (
        <PublicFormSubmit slug={slug} fields={legacyFieldsFromSchema(form.schema)} />
      )}
    </main>
  );
}
