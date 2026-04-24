import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Supplier scorecards" />
      <div className="page-content">
        <div className="surface p-6 text-sm text-[var(--muted)] max-w-2xl">SLA and KPI performance tracking per vendor. Feeds back into the Vendor directory for renewal decisions.</div>
      </div>
    </>
  );
}
