import { ChatSurface } from "@/components/workforce/ChatSurface";

/**
 * GVTEWAY vendor chat (ADR-0008 Move 3).
 *
 * Rooms open portal-side at `/p/[slug]/messages/[roomId]` (Amendment 4).
 * This one was never merely friction: a vendor has no COMPVSS reach at all,
 * so `/m/inbox/[id]` was a link into an app they cannot open.
 */
export const dynamic = "force-dynamic";

export default async function VendorChatPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <ChatSurface
      variant="portal"
      roomHref={(id) => `/p/${slug}/messages/${id}`}
      eyebrowLabel="Vendor"
      titleLabel="Chat"
    />
  );
}
