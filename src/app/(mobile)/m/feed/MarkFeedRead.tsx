"use client";

import { useEffect, useRef } from "react";
import { markFeedAnnouncementsRead } from "./actions";

/**
 * Fire-once read receipt for the announcements visible in the feed.
 * Mount-effect rather than a render side effect (audit A-36 pattern —
 * same reason chat's markRoomRead is client-fired).
 */
export function MarkFeedRead({ announcementIds }: { announcementIds: string[] }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current || announcementIds.length === 0) return;
    fired.current = true;
    void markFeedAnnouncementsRead({ announcementIds });
  }, [announcementIds]);
  return null;
}
