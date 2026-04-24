import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Treasury" />
      <div className="page-content">
        <div className="surface p-6 text-sm text-[var(--muted)] max-w-2xl">Multi-currency cash position, FX rates, and payments. Extends the existing Finance module with `stripe_events` + supplier payout data.</div>
      </div>
    </>
  );
}
