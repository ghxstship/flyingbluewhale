import Link from "next/link";
import { notFound } from "next/navigation";
import { getDocTemplate } from "@/lib/documents/registry";
import { resolveDocData, resolveDocBrand, supportsRecordBinding } from "@/lib/documents/resolvers";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { DocToolbar } from "@/components/documents/DocToolbar";

/**
 * Per-document preview/print route. Renders one of the 27 v6 templates through
 * the shared DocEngine + the client viewer toolbar. The same markup is the
 * print/PDF artifact via @media print in kit-documents.css.
 *
 * `?recordId=<uuid>` binds a live org-scoped record (internal generation) for
 * doc types that support it — the same data path the public API exposes at
 * POST /api/v1/documents/{docType}. Without it, the template renders its
 * sample showcase.
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

  if (recordId && supportsRecordBinding(docType)) {
    const session = await requireSession();
    const supabase = await createClient();
    const bound = await resolveDocData(docType, supabase, session.orgId, recordId);
    if (bound) {
      data = bound;
      const brand = await resolveDocBrand(supabase, session.orgId);
      org = brand.org;
      client = brand.client;
    }
  }

  return (
    <div>
      <div className="mx-auto max-w-[860px] px-6 pt-6 print:hidden">
        <Link
          href="/console/documents"
          className="font-mono text-[11px] tracking-wide text-[var(--p-text-3)] uppercase hover:text-[var(--p-accent-text)]"
        >
          ← Document library
        </Link>
      </div>
      <DocToolbar
        template={template}
        data={data}
        org={org}
        client={client}
        aiDraftEndpoint={docType === "proposal" ? "/api/v1/documents/proposal/ai-draft" : undefined}
      />
    </div>
  );
}
