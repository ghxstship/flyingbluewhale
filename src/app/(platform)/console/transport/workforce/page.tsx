import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Workforce Shuttles" />
      <div className="page-content">
        <div className="surface p-6 text-sm text-[var(--muted)] max-w-2xl">Shift-linked routes derived from rosters.</div>
      </div>
    </>
  );
}
