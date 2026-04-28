import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Playbooks" />
      <div className="page-content">
        <RoadmapStub
          title="Playbooks"
          description="ConOps playbook library. Uses the Boarding-Pass/Guide rendering pattern."
          inTheMeantime={{ href: "/console/projects", label: "Open Projects" }}
        />
      </div>
    </>
  );
}
