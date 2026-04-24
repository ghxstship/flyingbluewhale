import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader title="Legal" />
      <div className="page-content">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link className="surface hover-lift p-4" href="/console/legal/ip"><div className="text-sm font-medium">IP</div></Link>
          <Link className="surface hover-lift p-4" href="/console/legal/privacy"><div className="text-sm font-medium">Privacy</div></Link>
          <Link className="surface hover-lift p-4" href="/console/legal/privacy/dsar"><div className="text-sm font-medium">DSAR</div></Link>
          <Link className="surface hover-lift p-4" href="/console/legal/privacy/consent"><div className="text-sm font-medium">Consent</div></Link>
          <Link className="surface hover-lift p-4" href="/console/legal/privacy/datamap"><div className="text-sm font-medium">Data map</div></Link>
          <Link className="surface hover-lift p-4" href="/console/legal/insurance"><div className="text-sm font-medium">Insurance</div></Link>
        </div>
      </div>
    </>
  );
}
