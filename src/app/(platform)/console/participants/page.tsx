import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader title="Participants" />
      <div className="page-content">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <a className="surface hover-lift p-4" href="/console/participants/delegations"><div className="text-sm font-medium">Delegations</div></a>
          <a className="surface hover-lift p-4" href="/console/participants/entries"><div className="text-sm font-medium">Entries</div></a>
          <a className="surface hover-lift p-4" href="/console/participants/visa"><div className="text-sm font-medium">Visa</div></a>
        </div>
      </div>
    </>
  );
}
