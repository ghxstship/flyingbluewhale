import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Portal" title="Delegation portal" />
      <div className="page-content">
        <div className="surface p-6 text-sm text-[var(--muted)] max-w-2xl">Overview of your delegation — entries, bookings, rate-card orders, meetings, transport, accommodation, visa cases.</div>
      </div>
    </>
  );
}
