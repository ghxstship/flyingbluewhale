import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader title="Press conferences" />
      <div className="page-content">
        <div className="surface p-6 text-sm text-[var(--muted)] max-w-2xl">Scheduled press conferences. Media RSVPs via the /p/[slug]/media/pressconf portal.</div>
      </div>
    </>
  );
}
