import { ModuleHeader } from "@/components/Shell";
import { AssistantChat } from "./AssistantChat";

export const dynamic = "force-dynamic";

export default function AssistantPage() {
  return (
    <>
      <ModuleHeader eyebrow="AI" title="Assistant" subtitle="Streaming conversations grounded in your workspace" />
      <div className="page-content max-w-3xl">
        <AssistantChat />
      </div>
    </>
  );
}
