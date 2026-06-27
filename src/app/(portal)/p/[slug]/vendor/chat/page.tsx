import { ChatSurface } from "@/components/workforce/ChatSurface";

/** GVTEWAY vendor chat (ADR-0008 Move 3). */
export const dynamic = "force-dynamic";

export default function VendorChatPage() {
  return <ChatSurface variant="portal" roomHref={(id) => `/m/inbox/${id}`} eyebrowLabel="Vendor" titleLabel="Chat" />;
}
