import { ChatSurface } from "@/components/workforce/ChatSurface";

/**
 * GVTEWAY crew chat — thin wrapper over shared <ChatSurface>. Room
 * detail still routes to /m/inbox/[id] until portal-side room rendering
 * lifts in a future PR.
 */
export const dynamic = "force-dynamic";

export default function CrewChatPage() {
  return <ChatSurface variant="portal" roomHref={(id) => `/m/inbox/${id}`} eyebrowLabel="Crew" titleLabel="Chat" />;
}
