import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Mobile" title="Check-in" />
      <div className="page-content">
        <div className="surface p-6 text-sm text-[var(--muted)] max-w-2xl">Clock-in / clock-out. POSTs to /api/v1/shifts/checkin.</div>
      </div>
    </>
  );
}
