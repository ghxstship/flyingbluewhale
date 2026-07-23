import Link from "next/link";
import { notFound } from "next/navigation";
import { getDocTemplate } from "@/lib/documents/registry";
import { resolveDocData, resolveDocBrand, supportsRecordBinding } from "@/lib/documents/resolvers";
import { docDefaultBrand, getOrgDocSettings, isDocTypeOffered } from "@/lib/documents/org-settings";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { requireSession } from "@/lib/auth";
import { Alert } from "@/components/ui/Alert";
import { DocToolbar } from "@/components/documents/DocToolbar";
import { getDocRecordSource } from "../record-sources";
import { RecordPicker } from "./RecordPicker";

/**
 * Per-document preview/print route. Renders one of the 29 v6 templates through
 * the shared DocEngine + the client viewer toolbar. The same markup is the
 * print/PDF artifact via @media print in kit-documents.css.
 *
 * `?recordId=<uuid>` binds a live org-scoped record (internal generation) for
 * doc types that support it — the same data path the public API exposes at
 * POST /api/v1/documents/{docType}. Without it, the template renders its
 * sample showcase. A record picker (Combobox over the backing table) offers
 * the binding without hand-crafting the URL, and a FAILED binding renders an
 * explicit error instead of silently falling back to sample data — the sample
 * showcase must never masquerade as a real record.
 */

export const dynamic = "force-dynamic";

export default async function DocumentPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ docType: string }>;
  searchParams: Promise<{ recordId?: string }>;
}) {
  const { docType } = await params;
  const { recordId } = await searchParams;
  const template = getDocTemplate(docType);
  if (!template) notFound();

  let data: Record<string, unknown> | undefined;
  let org: Awaited<ReturnType<typeof resolveDocBrand>>["org"] | undefined;
  let client: Awaited<ReturnType<typeof resolveDocBrand>>["client"];
  let bindError: string | null = null;

  const bindable = supportsRecordBinding(docType);
  const session = await requireSession();
  const supabase = await createClient();

  // Configurator v1 (L-P2): a disabled type stays RENDERABLE here — the org
  // setting only removes it from creation pickers; existing records must keep
  // rendering. We annotate instead of blocking, and honor the org's default
  // brand mode for the toolbar's initial state.
  const docSettings = await getOrgDocSettings(supabase, session.orgId);
  const offered = isDocTypeOffered(docType, docSettings);
  const orgDefaultBrand = docDefaultBrand(docType, docSettings);

  if (recordId) {
    if (!bindable) {
      bindError =
        "This document type does not support record binding. The sample document is shown below; generate it with real data via the documents API instead.";
    } else {
      const bound = await resolveDocData(docType, supabase, session.orgId, recordId);
      if (bound) {
        data = bound;
        const brand = await resolveDocBrand(supabase, session.orgId);
        org = brand.org;
        client = brand.client;
      } else {
        bindError =
          "That record could not be found in your organization (or carries no bindable data). The SAMPLE document is shown below; its values are showcase copy, not the record.";
      }
    }
  }

  // Record picker — recent org-scoped rows from the doc type's backing table.
  let pickerOptions: Array<{ value: string; label: string }> = [];
  const source = bindable ? getDocRecordSource(docType) : undefined;
  if (source) {
    try {
      const { data: rows } = await (supabase as unknown as LooseSupabase)
        .from(source.table)
        .select(["id", ...source.columns].join(", "))
        .eq("org_id", session.orgId)
        .order(source.orderBy ?? "created_at", { ascending: false })
        .limit(50);
      pickerOptions = ((rows ?? []) as Array<Record<string, unknown>>).map((r) => ({
        value: String(r.id),
        label: source.label(r),
      }));
    } catch {
      pickerOptions = [];
    }
  }

  return (
    <div>
      <div className="mx-auto flex max-w-[860px] flex-wrap items-center justify-between gap-3 px-6 pt-6 print:hidden">
        <Link
          href="/studio/documents"
          className="font-mono text-[11px] tracking-wide text-[var(--p-text-3)] uppercase hover:text-[var(--p-accent-text)]"
        >
          ← Document library
        </Link>
        {source && pickerOptions.length > 0 && <RecordPicker options={pickerOptions} value={recordId ?? null} />}
      </div>
      {!offered && (
        <div className="mx-auto mt-4 max-w-[860px] px-6 print:hidden">
          <Alert kind="info">
            This document type is disabled in your organization&apos;s template library, so it is hidden
            from creation pickers. Existing records still render here. Manage this in the template
            library at /legend/hub/templates.
          </Alert>
        </div>
      )}
      {bindError && (
        <div className="mx-auto mt-4 max-w-[860px] px-6 print:hidden">
          <Alert kind="error">{bindError}</Alert>
        </div>
      )}
      <DocToolbar template={template} data={data} org={org} client={client} defaultBrand={orgDefaultBrand} />
    </div>
  );
}
