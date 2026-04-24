import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader title="Cases" />
      <div className="page-content">
        <div className="surface p-6 text-sm text-[var(--muted)] max-w-2xl">Protests, appeals, and juries. Cases reuse the incidents substrate with a 'case' sub-type and jury panel metadata.</div>
      </div>
    </>
  );
}
