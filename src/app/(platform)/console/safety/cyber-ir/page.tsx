import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Cyber Incident Response" />
      <div className="page-content">
        <RoadmapStub
          title="Cyber Incident Response"
          description="Cyber IR state — contain, eradicate, recover. Sub-type of incidents."
          inTheMeantime={{ href: "/console/operations/incidents", label: "Open the incident log" }}
        />
      </div>
    </>
  );
}
