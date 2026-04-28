import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Mobile" title="New Incident" />
      <div className="page-content">
        <RoadmapStub
          title="New Incident"
          description="Report a new incident."
          inTheMeantime={{ href: "/console/operations/incidents/new", label: "Use the desktop form" }}
        />
      </div>
    </>
  );
}
