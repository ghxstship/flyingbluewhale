import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Portal" title="Athlete portal" />
      <div className="page-content">
        <div className="surface p-6 text-sm text-[var(--muted)] max-w-2xl">Training bookings, resident service requests, safeguarding, visa, privacy.</div>
      </div>
    </>
  );
}
