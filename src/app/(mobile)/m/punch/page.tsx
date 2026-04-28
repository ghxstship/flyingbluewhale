import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Mobile" title="Punch List" />
      <div className="page-content">
        <RoadmapStub
          title="Punch List"
          description="Construction inspection."
          inTheMeantime={{ href: "/console/venues", label: "Open Venues" }}
        />
      </div>
    </>
  );
}
