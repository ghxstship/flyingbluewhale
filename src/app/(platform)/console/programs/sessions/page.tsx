import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader title="Sessions" />
      <div className="page-content">
        <div className="surface p-6 text-sm text-[var(--muted)] max-w-2xl">Session-level schedule (heats, rounds, medal sessions). Sits above events and drives ticketing allocations + broadcast booking.</div>
      </div>
    </>
  );
}
