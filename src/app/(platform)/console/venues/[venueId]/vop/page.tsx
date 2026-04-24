import { ModuleHeader } from "@/components/Shell";

export default async function Page({ params }: { params: Promise<{ venueId: string }> }) {
  const p = await params;
  return (
    <>
      <ModuleHeader eyebrow="Venue" title="Venue Operations Plan" subtitle={`ID: ${p.venueId}`} />
      <div className="page-content">
        <div className="surface p-6 text-sm text-[var(--muted)] max-w-2xl">Integrated operating manual for this venue.</div>
      </div>
    </>
  );
}
