import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Supplier Scorecards" />
      <div className="page-content">
        <RoadmapStub
          title="Supplier Scorecards"
          description="SLA and KPI performance tracking per vendor. Feeds back into the Vendor directory for renewal decisions."
          inTheMeantime={{ href: "/console/procurement/vendors", label: "Open Vendors" }}
        />
      </div>
    </>
  );
}
