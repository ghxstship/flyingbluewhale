import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Accreditation zones" />
      <div className="page-content">
        <div className="surface p-6 text-sm text-[var(--muted)] max-w-2xl">Zone register. Zones are defined per venue; this is a cross-venue read-only view.</div>
      </div>
    </>
  );
}
