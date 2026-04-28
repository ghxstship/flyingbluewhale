import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Program Scope" />
      <div className="page-content">
        <RoadmapStub
          title="Program Scope"
          description="Disciplines, events, and participant quotas. Serves as the source-of-truth for entries, schedule building, and officials assignment."
          inTheMeantime={{ href: "/console/participants/entries", label: "Open Participant Entries" }}
        />
      </div>
    </>
  );
}
