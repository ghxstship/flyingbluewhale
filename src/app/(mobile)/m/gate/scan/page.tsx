import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Mobile" title="Scan" />
      <div className="page-content">
        <RoadmapStub
          title="Scan"
          description="Camera-based barcode capture. POSTs to /api/v1/accreditation/scan."
          inTheMeantime={{ href: "/m/check-in", label: "Open check-in scan" }}
        />
      </div>
    </>
  );
}
