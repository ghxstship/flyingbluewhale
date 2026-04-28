import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Accreditation Policy" />
      <div className="page-content">
        <RoadmapStub
          title="Accreditation Policy"
          description="Authoritative category × zone privilege matrix. Edit categories under Categories; bind zones via each venue."
          inTheMeantime={{ href: "/console/accreditation/categories", label: "Open Categories" }}
        />
      </div>
    </>
  );
}
