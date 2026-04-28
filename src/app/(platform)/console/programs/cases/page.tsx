import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Cases" />
      <div className="page-content">
        <RoadmapStub
          title="Cases"
          description="Protests, appeals, and juries. Cases reuse the incidents substrate with a 'case' sub-type and jury panel metadata."
          inTheMeantime={{ href: "/console/operations/incidents", label: "Open the incident log" }}
        />
      </div>
    </>
  );
}
