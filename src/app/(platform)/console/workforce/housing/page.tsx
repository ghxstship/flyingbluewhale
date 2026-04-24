import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Workforce housing" />
      <div className="page-content">
        <div className="surface p-6 text-sm text-[var(--muted)] max-w-2xl">Billeting assignments. Book rooms via Accommodation → Group blocks.</div>
      </div>
    </>
  );
}
