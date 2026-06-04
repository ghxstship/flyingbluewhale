import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";

/**
 * Production hub (ADR-0006). The flagship capability — audio, lighting,
 * video, staging, rigging, power, fabrication — gets its own front
 * door, surfacing the three sub-domains as card-grid sections:
 * Inventory · Build · Show. Mirrors the sidebar shape so deep-linking
 * to /console/production lands operators on the same mental model
 * they'll see in the rail.
 */
export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Production" title="Production" subtitle="Inventory, build, show systems." />
      <div className="page-content space-y-6">
        <section>
          <h2 className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">Inventory</h2>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link className="surface hover-lift p-4" href="/console/production/equipment">
              <div className="text-sm font-medium">Equipment</div>
              <div className="mt-1 text-xs text-[var(--text-muted)]">Owned assets + maintenance</div>
            </Link>
            <Link className="surface hover-lift p-4" href="/console/production/equipment/utilization">
              <div className="text-sm font-medium">Equipment Utilization</div>
              <div className="mt-1 text-xs text-[var(--text-muted)]">30/90-day rollup + idle revenue</div>
            </Link>
            <Link className="surface hover-lift p-4" href="/console/production/av">
              <div className="text-sm font-medium">AV Inventory</div>
            </Link>
            <Link className="surface hover-lift p-4" href="/console/production/rentals">
              <div className="text-sm font-medium">Rentals</div>
            </Link>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">Build</h2>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link className="surface hover-lift p-4" href="/console/production/fabrication">
              <div className="text-sm font-medium">Fabrication</div>
            </Link>
            <Link className="surface hover-lift p-4" href="/console/production/compounds">
              <div className="text-sm font-medium">Compounds</div>
            </Link>
            <Link className="surface hover-lift p-4" href="/console/production/warehouse">
              <div className="text-sm font-medium">Yard</div>
            </Link>
            <Link className="surface hover-lift p-4" href="/console/punch">
              <div className="text-sm font-medium">Punch List</div>
            </Link>
            <Link className="surface hover-lift p-4" href="/console/captures">
              <div className="text-sm font-medium">Reality Captures</div>
            </Link>
            <Link className="surface hover-lift p-4" href="/console/photos">
              <div className="text-sm font-medium">Photo Log</div>
            </Link>
            <Link className="surface hover-lift p-4" href="/console/warranties">
              <div className="text-sm font-medium">Warranties</div>
            </Link>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">Show</h2>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link className="surface hover-lift p-4" href="/console/production/ros">
              <div className="text-sm font-medium">Run of Show</div>
              <div className="mt-1 text-xs text-[var(--text-muted)]">Cue-by-cue timeline</div>
            </Link>
            <Link className="surface hover-lift p-4" href="/console/production/dispatch/live">
              <div className="text-sm font-medium">Live Dispatch</div>
            </Link>
            <Link className="surface hover-lift p-4" href="/console/production/logistics">
              <div className="text-sm font-medium">Production Logistics</div>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
