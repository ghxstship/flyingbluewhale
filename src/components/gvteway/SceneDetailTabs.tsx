"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";

/**
 * SceneDetailTabs — the feed · events · members switcher on a scene detail
 * page (design_handoff §2). In-page state (Radix `Tabs`), so it's a client
 * island the server page mounts. Content is firstRun until the
 * 20260623120000_gvteway_consumer.sql migration is applied (item 4) — at which
 * point the page passes resolved `post` / `set_time` / `scene_member` rows in
 * as the children of each tab.
 */
export function SceneDetailTabs({
  feed,
  events,
  members,
}: {
  feed?: React.ReactNode;
  events?: React.ReactNode;
  members?: React.ReactNode;
}) {
  return (
    <Tabs defaultValue="feed" className="space-y-5">
      <TabsList scrollable>
        <TabsTrigger value="feed">Feed</TabsTrigger>
        <TabsTrigger value="events">Events</TabsTrigger>
        <TabsTrigger value="members">Members</TabsTrigger>
      </TabsList>

      <TabsContent value="feed">
        {feed ?? (
          <EmptyState
            title="No posts yet"
            description="When members post, their updates show up here."
          />
        )}
      </TabsContent>
      <TabsContent value="events">
        {events ?? (
          <EmptyState
            title="No events yet"
            description="Events this scene is into will appear here — each one hands off to its ticketing provider."
          />
        )}
      </TabsContent>
      <TabsContent value="members">
        {members ?? (
          <EmptyState
            title="No members yet"
            description="Be the first to join — follow the scene to get its feed in Community."
          />
        )}
      </TabsContent>
    </Tabs>
  );
}
