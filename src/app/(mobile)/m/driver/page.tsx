import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Mobile" title="Driver" />
      <div className="page-content">
        <RoadmapStub
          title="Driver"
          description="Today's manifest — scan passengers and confirm runs."
          inTheMeantime={{ href: "/console/transport/dispatch", label: "Open Dispatch" }}
        />
      </div>
    </>
  );
}
