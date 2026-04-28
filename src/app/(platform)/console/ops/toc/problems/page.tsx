import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Problems" />
      <div className="page-content">
        <RoadmapStub
          title="Problems"
          description="ITIL problem management."
          inTheMeantime={{ href: "/console/operations/incidents", label: "Open the incident log" }}
        />
      </div>
    </>
  );
}
