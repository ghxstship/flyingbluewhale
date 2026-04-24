import { ModuleHeader } from "@/components/Shell";

export default async function Page({ params }: { params: Promise<{ venueId: string }> }) {
  const p = await params;
  return (
    <>
      <ModuleHeader eyebrow="Venue" title="Certifications" subtitle={`ID: ${p.venueId}`} />
      <div className="page-content">
        <div className="surface p-6 text-sm text-[var(--muted)] max-w-2xl">FOP homologation, safety, and permits.</div>
      </div>
    </>
  );
}
