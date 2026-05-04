import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import { EmptyState } from "@/components/ui/EmptyState";
import { PublicFormSubmit, type PublicFormField } from "./PublicFormSubmit";

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

function fieldsFromSchema(schema: Json): PublicFormField[] {
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
  // Public form lookup needs service-role to bypass org-scoped RLS on form_defs.
  // If the service key isn't configured (e.g. local dev without secret), the
  // page renders as not-found rather than throwing — same observable result.
  if (!isServiceClientAvailable()) return null;
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("form_defs")
    .select("id, org_id, slug, title, description, status, schema")
    .eq("slug", slug)
    .eq("status", "published")
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

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const form = await loadForm(slug);
  if (!form) notFound();

  const fields = fieldsFromSchema(form.schema);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
      <header className="mb-8">
        <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">Form</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{form.title}</h1>
        {form.description && <p className="mt-3 text-sm text-[var(--text-secondary)]">{form.description}</p>}
      </header>

      {fields.length === 0 ? (
        <EmptyState title="No fields yet" description="This form is being prepared. Check back soon." />
      ) : (
        <PublicFormSubmit slug={slug} fields={fields} />
      )}
    </main>
  );
}
