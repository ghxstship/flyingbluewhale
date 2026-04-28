import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Service Requests" />
      <div className="page-content">
        <RoadmapStub
          title="Service Requests"
          description="Resident and participant service tickets."
          inTheMeantime={{ href: "/console/operations/incidents", label: "Open the incident log" }}
        />
      </div>
    </>
  );
}
