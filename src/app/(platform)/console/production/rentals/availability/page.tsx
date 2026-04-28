import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Rental Availability" />
      <div className="page-content">
        <RoadmapStub
          title="Rental Availability"
          description="Equipment availability matrix."
          inTheMeantime={{ href: "/console/production/rentals", label: "Open Rentals" }}
        />
      </div>
    </>
  );
}
