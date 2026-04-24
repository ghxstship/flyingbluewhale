import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Mobile" title="Scan" />
      <div className="page-content">
        <div className="surface p-6 text-sm text-[var(--muted)] max-w-2xl">Camera-based barcode capture. POSTs to /api/v1/accreditation/scan.</div>
      </div>
    </>
  );
}
