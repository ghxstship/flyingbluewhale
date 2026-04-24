import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader title="Operations" />
      <div className="page-content">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link className="surface hover-lift p-4" href="/console/ops/toc"><div className="text-sm font-medium">TOC</div></Link>
          <Link className="surface hover-lift p-4" href="/console/ops/toc/problems"><div className="text-sm font-medium">Problems</div></Link>
          <Link className="surface hover-lift p-4" href="/console/ops/toc/changes"><div className="text-sm font-medium">Changes</div></Link>
          <Link className="surface hover-lift p-4" href="/console/integrations"><div className="text-sm font-medium">Integrations</div></Link>
        </div>
      </div>
    </>
  );
}
