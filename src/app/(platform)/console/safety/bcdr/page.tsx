import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="BC/DR" />
      <div className="page-content">
        <RoadmapStub
          title="BC/DR"
          description="Business continuity and disaster recovery runbooks + exercises."
          inTheMeantime={{ href: "/console/programs/readiness", label: "Open Readiness Exercises" }}
        />
      </div>
    </>
  );
}
