import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader title="Shift phases" subtitle="Micro-scheduling: load-in, show, load-out segments" />
      <div className="page-content" />
    </>
  );
}
