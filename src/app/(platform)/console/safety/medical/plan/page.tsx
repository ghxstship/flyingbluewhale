import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Medical plan" />
      <div className="page-content">
        <div className="surface p-6 text-sm text-[var(--muted)] max-w-2xl">Games medical services plan. Integrates athlete, workforce, spectator medical services.</div>
      </div>
    </>
  );
}
