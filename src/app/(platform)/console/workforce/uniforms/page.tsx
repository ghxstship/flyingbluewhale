import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Uniforms" />
      <div className="page-content">
        <div className="surface p-6 text-sm text-[var(--muted)] max-w-2xl">Uniform distribution — inventory tracked in rate_card_items(catalog='uniform').</div>
      </div>
    </>
  );
}
