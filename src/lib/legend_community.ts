/**
 * LEG3ND community (Skool-class) vocabulary. Posts / comments / reactions.
 * Members + contribution points come from the shared gamification ledger
 * (see src/lib/legend_gamification.ts). Backed by migration
 * 20260623150040_legend_community.
 */

export const POST_STATES = ["draft", "published", "archived", "removed"] as const;
export type PostState = (typeof POST_STATES)[number];

export const REACTION_KINDS = ["like", "celebrate", "insightful"] as const;
export type ReactionKind = (typeof REACTION_KINDS)[number];
export const REACTION_LABELS: Record<ReactionKind, string> = {
  like: "Like",
  celebrate: "Celebrate",
  insightful: "Insightful",
};

export const POST_CATEGORIES = ["general", "wins", "questions", "resources", "introductions"] as const;
export type PostCategory = (typeof POST_CATEGORIES)[number];
export const POST_CATEGORY_LABELS: Record<PostCategory, string> = {
  general: "General",
  wins: "Wins",
  questions: "Questions",
  resources: "Resources",
  introductions: "Introductions",
};

export type CommunityPost = {
  id: string;
  org_id: string;
  author_id: string | null;
  title: string;
  body_html: string;
  category: string;
  pinned: boolean;
  like_count: number;
  comment_count: number;
  post_state: PostState;
  created_at: string;
  updated_at: string;
};

export type CommunityMember = {
  user_id: string;
  name: string;
  avatar_url: string | null;
  /** contribution points from the shared ledger (source='legend'). */
  points: number;
  role: string | null;
};
