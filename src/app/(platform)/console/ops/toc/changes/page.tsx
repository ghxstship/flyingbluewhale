import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Changes" />
      <div className="page-content">
        <RoadmapStub
          title="Changes"
          description="ITIL change management."
          inTheMeantime={{ href: "/console/projects", label: "Open Projects" }}
        />
      </div>
    </>
  );
}
