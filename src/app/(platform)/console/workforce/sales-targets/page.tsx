import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader title="Sales targets" subtitle="Projected revenue vs labour %" />
      <div className="page-content" />
    </>
  );
}
