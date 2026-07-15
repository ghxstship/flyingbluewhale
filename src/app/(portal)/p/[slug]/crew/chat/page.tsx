import { ChatSurface } from "@/components/workforce/ChatSurface";

/**
 * GVTEWAY crew chat — thin wrapper over shared <ChatSurface>.
 *
 * Rooms open at `/p/[slug]/messages/[roomId]`, which already existed and is
 * richer than the mobile room it was deep-linking to (cursor pagination,
 * author names, inbox fan-out on send). The portal was ejecting users into
 * COMPVSS to render a room it already had; the only thing missing was the
 * `slug` needed to build the URL (ADR-0008 Amendment 4).
 */
export const dynamic = "force-dynamic";

export default async function CrewChatPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <ChatSurface
      variant="portal"
      roomHref={(id) => `/p/${slug}/messages/${id}`}
      eyebrowLabel="Crew"
      titleLabel="Chat"
    />
  );
}
