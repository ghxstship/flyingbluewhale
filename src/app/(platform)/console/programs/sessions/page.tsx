import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Sessions" />
      <div className="page-content">
        <RoadmapStub
          title="Sessions"
          description="Session-level schedule (heats, rounds, medal sessions). Sits above events and drives ticketing allocations + broadcast booking."
          inTheMeantime={{ href: "/console/events", label: "Open Events" }}
        />
      </div>
    </>
  );
}
