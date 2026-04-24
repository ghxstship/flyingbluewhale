import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Mobile" title="Gate" />
      <div className="page-content">
        <div className="surface p-6 text-sm text-[var(--muted)] max-w-2xl">Scan accreditation or ticket to grant/deny access. Device records the decision to the server.</div>
      </div>
    </>
  );
}
