import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Campaigns" />
      <div className="page-content">
        <RoadmapStub
          title="Campaigns"
          description="Marketing and comms campaigns."
          inTheMeantime={{ href: "/console/commercial", label: "Open Commercial" }}
        />
      </div>
    </>
  );
}
