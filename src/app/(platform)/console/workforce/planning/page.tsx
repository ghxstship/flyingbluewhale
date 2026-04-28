import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Workforce Planning" />
      <div className="page-content">
        <RoadmapStub
          title="Workforce Planning"
          description="FTE strategy — plan headcount by venue, zone and shift window."
          inTheMeantime={{ href: "/console/workforce/deployment", label: "Open Workforce Deployment" }}
        />
      </div>
    </>
  );
}
