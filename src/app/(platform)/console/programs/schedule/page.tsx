import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader title="Master schedule" />
      <div className="page-content">
        <div className="surface p-6 text-sm text-[var(--muted)] max-w-2xl">Integrated master schedule across functional areas. Dependencies, critical path, and baselines map onto the existing /console/schedule feed. View Gantt by selecting a project.</div>
      </div>
    </>
  );
}
