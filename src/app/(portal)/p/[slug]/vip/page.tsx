import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Portal" title="VIP portal" />
      <div className="page-content">
        <div className="surface p-6 text-sm text-[var(--muted)] max-w-2xl">Dedicated transport, accommodation, and itinerary.</div>
      </div>
    </>
  );
}
