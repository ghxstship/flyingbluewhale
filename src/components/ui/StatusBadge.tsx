'use client';

/** StatusBadge — displays a status with color coding */

export const PIPELINE_STAGE_COLORS: Record<string, string> = {
  lead: 'bg-slate-500/20 text-slate-300',
  qualified: 'bg-blue-500/20 text-blue-300',
  proposal: 'bg-purple-500/20 text-purple-300',
  negotiation: 'bg-amber-500/20 text-amber-300',
  closed_won: 'bg-emerald-500/20 text-emerald-300',
  closed_lost: 'bg-red-500/20 text-red-300',
};

export const ROLE_BADGE_COLORS: Record<string, string> = {
  developer: 'bg-purple-500/20 text-purple-300',
  owner: 'bg-amber-500/20 text-amber-300',
  admin: 'bg-blue-500/20 text-blue-300',
  team_member: 'bg-emerald-500/20 text-emerald-300',
  collaborator: 'bg-cyan-500/20 text-cyan-300',
  contractor: 'bg-orange-500/20 text-orange-300',
  crew: 'bg-teal-500/20 text-teal-300',
  client: 'bg-indigo-500/20 text-indigo-300',
  viewer: 'bg-slate-500/20 text-slate-300',
  community: 'bg-gray-500/20 text-gray-300',
};

export const ROLE_LABELS: Record<string, string> = {
  developer: 'Developer',
  owner: 'Owner',
  admin: 'Admin',
  team_member: 'Team Member',
  collaborator: 'Collaborator',
  contractor: 'Contractor',
  crew: 'Crew',
  client: 'Client',
  viewer: 'Viewer',
  community: 'Community',
};

interface StatusBadgeProps {
  status: string;
  colorMap?: Record<string, string>;
  className?: string;
}

export function StatusBadge({ status, colorMap, className = '' }: StatusBadgeProps) {
  const colors = colorMap ?? PIPELINE_STAGE_COLORS;
  const colorClass = colors[status] ?? 'bg-surface-hover text-text-secondary';
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass} ${className}`}>
      {label}
    </span>
  );
}

export default StatusBadge;
