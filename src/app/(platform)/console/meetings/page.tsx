import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader title="Meetings" />
      <div className="page-content">
        <div className="surface p-6 text-sm text-[var(--muted)] max-w-2xl">Technical meetings, Chef-de-Mission interfaces, team leaders' briefings. RSVPs and minutes captured per meeting.</div>
      </div>
    </>
  );
}
