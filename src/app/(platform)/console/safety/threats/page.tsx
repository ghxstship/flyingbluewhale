import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Threat Register" />
      <div className="page-content">
        <RoadmapStub
          title="Threat Register"
          description="Intelligence and threat assessment. Classification-scoped distribution."
          inTheMeantime={{ href: "/console/operations/incidents", label: "Open the incident log" }}
        />
      </div>
    </>
  );
}
