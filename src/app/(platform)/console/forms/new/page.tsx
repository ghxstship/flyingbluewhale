import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="New form" />
      <div className="page-content">
        <div className="surface p-6 text-sm text-[var(--muted)] max-w-2xl">Create a form.</div>
      </div>
    </>
  );
}
