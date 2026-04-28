import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Compounds" />
      <div className="page-content">
        <RoadmapStub
          title="Compounds"
          description="Broadcast compounds and cable plant."
          inTheMeantime={{ href: "/console/venues", label: "Open Venues" }}
        />
      </div>
    </>
  );
}
