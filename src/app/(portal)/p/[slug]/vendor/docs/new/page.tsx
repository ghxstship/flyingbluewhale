import { DocUploadForm } from "@/components/workforce/DocUploadForm";

/**
 * GVTEWAY vendor · Upload document (ADR-0008 Amendment 4).
 *
 * Portal-native. The upload control is an OS file picker, not a camera
 * sensor (the form carries no `capture` attribute), so nothing about this
 * write needs the field shell.
 */
export const dynamic = "force-dynamic";

export default async function VendorDocsNewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const base = `/p/${slug}/vendor/docs`;

  return (
    <div className="page-content">
      <div className="eyebrow eyebrow-accent">Vendor</div>
      <h1 className="mt-1">Upload Document</h1>
      <div className="mt-6 max-w-2xl">
        <DocUploadForm revalidate={base} backHref={base} />
      </div>
    </div>
  );
}
