import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Sourcing" />
      <div className="page-content">
        <div className="surface p-6 text-sm text-[var(--muted)] max-w-2xl">RFQ and contract-linked sourcing events. Coordinates with existing /console/procurement/rfqs and Ironclad/DocuSign for final contracts.</div>
      </div>
    </>
  );
}
