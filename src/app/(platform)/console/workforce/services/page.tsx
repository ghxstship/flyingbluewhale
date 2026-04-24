import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Workforce services" />
      <div className="page-content">
        <div className="surface p-6 text-sm text-[var(--muted)] max-w-2xl">Meal credits, break areas, shuttle access. Tied to shifts + check-ins.</div>
      </div>
    </>
  );
}
