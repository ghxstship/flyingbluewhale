import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Safety incidents" />
      <div className="page-content">
        <div className="surface p-6 text-sm text-[var(--muted)] max-w-2xl">Unified physical + cyber incident view. Drill into Major incident, Cyber IR, Medical encounters.</div>
      </div>
    </>
  );
}
