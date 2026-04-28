import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Village" />
      <div className="page-content">
        <RoadmapStub
          title="Village"
          description="Residential zone under Venues (kind='village')."
          inTheMeantime={{ href: "/console/venues", label: "Open Venues" }}
        />
      </div>
    </>
  );
}
