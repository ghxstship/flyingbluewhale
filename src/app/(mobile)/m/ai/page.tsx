import { AiAgentChat } from "@/components/compvss/AiAgentChat";

export const dynamic = "force-dynamic";

export default function AiAgentPage() {
  return (
    <div className="flex h-[calc(100dvh-var(--topbar-height,44px)-var(--tabbar-height,64px))] flex-col">
      <AiAgentChat />
    </div>
  );
}
