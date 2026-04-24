import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Freight" />
      <div className="page-content">
        <div className="surface p-6 text-sm text-[var(--muted)] max-w-2xl">Customs and bonded warehousing. Integrate a TMS (Flexport, project44).</div>
      </div>
    </>
  );
}
