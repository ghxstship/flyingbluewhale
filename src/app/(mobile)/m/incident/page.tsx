import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Mobile" title="Incident" />
      <div className="page-content">
        <RoadmapStub
          title="Incident"
          description="Field incident reporting."
          inTheMeantime={{ href: "/m/incidents/new", label: "Report an incident" }}
        />
      </div>
    </>
  );
}
