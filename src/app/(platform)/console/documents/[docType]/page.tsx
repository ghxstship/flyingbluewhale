import Link from "next/link";
import { notFound } from "next/navigation";
import { getDocTemplate } from "@/lib/documents/registry";
import { DocToolbar } from "@/components/documents/DocToolbar";

/**
 * Per-document preview/print route. Renders one of the 27 v6 templates through
 * the shared DocEngine + the client viewer toolbar. The same markup is the
 * print/PDF artifact via @media print in kit-documents.css.
 */

export const dynamic = "force-dynamic";

export default async function DocumentPreviewPage({
  params,
}: {
  params: Promise<{ docType: string }>;
}) {
  const { docType } = await params;
  const template = getDocTemplate(docType);
  if (!template) notFound();

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
      <DocToolbar template={template} />
    </div>
  );
}
