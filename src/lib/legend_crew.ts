/**
 * LEG3ND learning crews / cohorts vocabulary. Social-learning teams whose XP
 * rolls up from the shared points_ledger (source-agnostic). Distinct from the
 * COMPVSS field `crew_members`. Backed by migration 20260623160010_legend_crews
 * (legend_crews, legend_crew_members).
 */

export const CREW_STATES = ["active", "archived"] as const;
export type CrewState = (typeof CREW_STATES)[number];

export const CREW_ROLES = ["lead", "member"] as const;
export type CrewRole = (typeof CREW_ROLES)[number];
export const CREW_ROLE_LABELS: Record<CrewRole, string> = {
  lead: "Lead",
  member: "Member",
};

export type Crew = {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  crew_state: CrewState;
};

export type CrewMember = {
  id: string;
  org_id: string;
  crew_id: string;
  user_id: string;
  crew_role: CrewRole;
};

export type CrewStanding = {
  crew: Crew;
  memberCount: number;
  points: number;
};

/** Rank crews by total points (desc); returns rows with a 1-based rank. */
export function rankCrews(standings: CrewStanding[]): Array<CrewStanding & { rank: number }> {
  return [...standings]
    .sort((a, b) => b.points - a.points)
    .map((s, i) => ({ ...s, rank: i + 1 }));
}
