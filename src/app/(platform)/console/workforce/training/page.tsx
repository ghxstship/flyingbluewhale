import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Training catalog" />
      <div className="page-content">
        <div className="surface p-6 text-sm text-[var(--muted)] max-w-2xl">Training courses and assignments. Integrate an LMS (Docebo, TalentLMS) to deliver content.</div>
      </div>
    </>
  );
}
