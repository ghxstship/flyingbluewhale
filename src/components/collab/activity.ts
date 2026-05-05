// Activity timeline barrel — owned by Phase 2.2 (ActivityDrawer).
// Kept in its own file so the broader `index.ts` barrel can be edited
// independently by P2.1 (CommentThread/MentionInput) without conflict.

export { ActivityDrawer } from "./ActivityDrawer";
export type { ActivityDrawerProps } from "./ActivityDrawer";
export { ActivityItem, formatActivity } from "./ActivityItem";
