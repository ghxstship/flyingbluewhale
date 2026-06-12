import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader title="My inductions" subtitle="Safety briefing compliance status" />
      <div className="page-content" />
    </>
  );
}
