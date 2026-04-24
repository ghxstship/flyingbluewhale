import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Cyber incident response" />
      <div className="page-content">
        <div className="surface p-6 text-sm text-[var(--muted)] max-w-2xl">Cyber IR state — contain, eradicate, recover. Sub-type of incidents.</div>
      </div>
    </>
  );
}
