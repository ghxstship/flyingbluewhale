import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Safety" title="Incidents (unified view)" />
      <div className="page-content">
        <RoadmapStub
          title="Cross-domain incident roll-up"
          description="A single feed that joins ops incidents, major-incident timelines, cyber-IR cases, and medical encounters with severity-weighted ranking and a per-zone heatmap."
          capabilities={[
            "Filter by severity, domain (ops/cyber/medical), or venue",
            "Roll-up KPIs (open vs closed, mean time to resolve)",
            "Drill from any row to the source detail page",
          ]}
          inTheMeantime={{ href: "/console/operations/incidents", label: "Open the operations incident log" }}
        />
      </div>
    </>
  );
}
