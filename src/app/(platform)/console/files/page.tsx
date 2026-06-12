import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader title="Files" subtitle="Global file browser" />
      <div className="page-content" />
    </>
  );
}
