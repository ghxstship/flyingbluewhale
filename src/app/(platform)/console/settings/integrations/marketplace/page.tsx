import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Integrations Marketplace" />
      <div className="page-content">
        <RoadmapStub
          title="Integrations Marketplace"
          description="Browse available connectors."
          inTheMeantime={{ href: "/console/settings", label: "Open Settings" }}
        />
      </div>
    </>
  );
}
