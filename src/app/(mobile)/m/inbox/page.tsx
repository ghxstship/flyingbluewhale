import { ChatSurface } from "@/components/connecteam/ChatSurface";

/** COMPVSS inbox — thin wrapper over shared <ChatSurface>. */
export const dynamic = "force-dynamic";

export default function InboxPage() {
  return <ChatSurface variant="mobile" roomHref={(id) => `/m/inbox/${id}`} />;
}
