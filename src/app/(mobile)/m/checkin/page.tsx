import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Mobile" title="Check-in" />
      <div className="page-content">
        <RoadmapStub
          title="Check-in"
          description="Clock-in / clock-out. POSTs to /api/v1/shifts/checkin."
          inTheMeantime={{ href: "/m/crew/clock", label: "Open clock" }}
        />
      </div>
    </>
  );
}
