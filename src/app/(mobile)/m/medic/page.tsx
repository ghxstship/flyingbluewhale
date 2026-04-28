import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Mobile" title="Medic" />
      <div className="page-content">
        <RoadmapStub
          title="Medic"
          description="Medical encounter triage."
          inTheMeantime={{ href: "/m/medic/new", label: "Log a new encounter" }}
        />
      </div>
    </>
  );
}
