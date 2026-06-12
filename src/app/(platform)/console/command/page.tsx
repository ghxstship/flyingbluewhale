import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader title="Command palette" subtitle="Global search and actions" />
      <div className="page-content" />
    </>
  );
}
