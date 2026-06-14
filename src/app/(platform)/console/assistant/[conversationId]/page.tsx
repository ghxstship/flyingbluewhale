import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { ChatComposer } from "./ChatComposer";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  const { t } = await getRequestT();

  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.assistant.eyebrow", undefined, "AI")}
          title={t("console.assistant.title", undefined, "Assistant")}
        />
        <ConfigureSupabase />
      </>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();

  // Pin both org_id and user_id — conversations are per-user (the chat
  // route enforces the same), so an org peer's id must 404, not leak.
  const { data: convo } = await supabase
    .from("ai_conversations")
    .select("id, title, ai_scope, created_at, project:project_id(name)")
    .eq("id", conversationId)
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId)
    .maybeSingle();

  if (!convo) notFound();

  const { data: messages } = await supabase
    .from("ai_messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  const turns = (messages ?? []).map((m) => ({ id: m.id, role: m.role, content: m.content }));
  const project = (convo.project ?? null) as { name: string | null } | null;
  const title = convo.title?.trim() || t("console.assistant.untitled", undefined, "(untitled)");

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.assistant.eyebrow", undefined, "AI")}
        title={title}
        subtitle={project?.name ?? undefined}
        breadcrumbs={[
          { label: t("console.assistant.title", undefined, "Assistant"), href: "/console/assistant" },
          { label: title },
        ]}
        action={
          convo.ai_scope ? (
            <Badge variant="info">{toTitle(convo.ai_scope)}</Badge>
          ) : (
            <Badge variant="muted">{t("console.assistant.scope.global", undefined, "Global")}</Badge>
          )
        }
      />
      <div className="page-content">
        <ChatComposer conversationId={convo.id} initialTurns={turns} />
      </div>
    </>
  );
}
