import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ModuleHeader } from "@/components/Shell";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { AssistantChat } from "./AssistantChat";

export const dynamic = "force-dynamic";

type Conversation = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export default async function AssistantPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const session = await requireSession();
  const { c: conversationId } = await searchParams;

  // Sea Trial FINDING-006: AI is gated on ANTHROPIC_API_KEY. When unset,
  // surface a friendly empty state instead of letting the chat box 500 on
  // every send.
  if (!env.ANTHROPIC_API_KEY) {
    return (
      <>
        <ModuleHeader title="AI Assistant" subtitle="Not configured" />
        <div className="page-content max-w-xl">
          <EmptyState
            icon={<Sparkles size={32} />}
            title="AI Assistant is offline"
            description="The Anthropic API key isn't configured for this environment. Conversations and history are saved per-org but new responses are paused until an admin sets ANTHROPIC_API_KEY in the deployment environment."
          />
        </div>
      </>
    );
  }

  const supabase = await createClient();

  const { data: conversations } = await supabase
    .from("ai_conversations")
    .select("id,title,created_at,updated_at")
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId)
    .order("updated_at", { ascending: false })
    .limit(50);

  const list = (conversations ?? []) as Conversation[];

  const active = conversationId ? (list.find((c) => c.id === conversationId) ?? null) : null;

  let initialMessages: Array<{ role: "user" | "assistant"; content: string }> = [];
  if (active) {
    const { data: msgs } = await supabase
      .from("ai_messages")
      .select("role,content")
      .eq("conversation_id", active.id)
      .order("created_at", { ascending: true });
    initialMessages = ((msgs ?? []) as Array<{ role: string; content: string }>)
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
  }

  return (
    <>
      <ModuleHeader
        title="AI Assistant"
        subtitle="Ask anything about your projects, invoices, deliverables, or crew."
      />
      <div className="page-content grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="surface flex flex-col gap-1 p-3">
          <Link href="/console/ai/assistant" className="nav-item text-xs font-semibold">
            + New conversation
          </Link>
          <div className="mt-3 text-[10px] font-semibold tracking-[0.2em] text-[var(--text-muted)] uppercase">
            Recent
          </div>
          {list.length === 0 ? (
            <p className="px-2 py-3 text-xs text-[var(--text-secondary)]">
              No conversations yet. Start one on the right.
            </p>
          ) : (
            list.map((c) => (
              <Link
                key={c.id}
                href={`/console/ai/assistant?c=${c.id}`}
                className={`nav-item truncate text-xs ${
                  active?.id === c.id ? "bg-[var(--surface-raised)] text-[var(--text)]" : ""
                }`}
                title={c.title}
              >
                {c.title || "Untitled"}
              </Link>
            ))
          )}
        </aside>
        <AssistantChat conversationId={active?.id ?? null} initialMessages={initialMessages} />
      </div>
    </>
  );
}
