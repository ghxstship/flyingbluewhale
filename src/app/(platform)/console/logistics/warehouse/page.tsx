import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Warehouse" />
      <div className="page-content">
        <div className="surface p-6 text-sm text-[var(--muted)] max-w-2xl">FF&E warehouse management. Mobile scanning via /m/wms.</div>
      </div>
    </>
  );
}
