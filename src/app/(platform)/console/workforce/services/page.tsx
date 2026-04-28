import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Workforce Services" />
      <div className="page-content">
        <RoadmapStub
          title="Workforce Services"
          description="Meal credits, break areas, shuttle access. Tied to shifts + check-ins."
          inTheMeantime={{ href: "/console/workforce/rosters", label: "Open Rosters" }}
        />
      </div>
    </>
  );
}
