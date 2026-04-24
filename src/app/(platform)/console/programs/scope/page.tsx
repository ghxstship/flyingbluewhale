import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader title="Program scope" />
      <div className="page-content">
        <div className="surface p-6 text-sm text-[var(--muted)] max-w-2xl">Disciplines, events, and participant quotas. Serves as the source-of-truth for entries, schedule building, and officials assignment.</div>
      </div>
    </>
  );
}
