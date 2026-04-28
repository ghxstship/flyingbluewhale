import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Chain of Custody" />
      <div className="page-content">
        <RoadmapStub
          title="Chain of Custody"
          description="Sample and evidence tracking — COC entries captured via /m/coc."
          inTheMeantime={{ href: "/m/coc", label: "Open mobile COC" }}
        />
      </div>
    </>
  );
}
