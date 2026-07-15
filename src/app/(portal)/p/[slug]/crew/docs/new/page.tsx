import { DocUploadForm } from "@/components/workforce/DocUploadForm";

/**
 * GVTEWAY crew · Upload document (ADR-0008 Amendment 4).
 *
 * Portal-native. The upload control is an OS file picker, not a camera
 * sensor (the form carries no `capture` attribute), so nothing about this
 * write needs the field shell.
 */
export const dynamic = "force-dynamic";

export default async function CrewDocsNewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const base = `/p/${slug}/crew/docs`;

  return (
    <div className="page-content">
      <div className="text-xs font-semibold tracking-wider text-[var(--p-accent)] uppercase">Crew</div>
      <h1 className="mt-1 text-2xl font-semibold">Upload Document</h1>
      <div className="mt-6 max-w-2xl">
        <DocUploadForm revalidate={base} backHref={base} />
      </div>
    </div>
  );
}
