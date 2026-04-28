import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Mobile" title="Swap Shift" />
      <div className="page-content">
        <RoadmapStub
          title="Swap Shift"
          description="Request a swap with another rostered member."
          inTheMeantime={{ href: "/m/shift", label: "Open shift" }}
        />
      </div>
    </>
  );
}
