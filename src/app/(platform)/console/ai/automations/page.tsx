import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Automations" />
      <div className="page-content">
        <RoadmapStub title="Automations" description="AI-driven automations." />
      </div>
    </>
  );
}
