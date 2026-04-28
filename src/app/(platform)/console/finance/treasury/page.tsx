import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Treasury" />
      <div className="page-content">
        <RoadmapStub
          title="Treasury"
          description="Multi-currency cash position, FX rates, and payments. Extends the existing Finance module with stripe_events + supplier payout data."
          inTheMeantime={{ href: "/console/finance/payouts", label: "Open Payouts" }}
        />
      </div>
    </>
  );
}
