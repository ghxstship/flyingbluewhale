/** Role configuration — labels and display options */

import type { PlatformRole } from '@/lib/supabase/types';

/** Platform + project role display labels.
 *  Uses Record<string, string> intentionally so it can also display
 *  any legacy roles without compile errors. Access is safe because
 *  the ?? fallback handles missing keys.
 */
export const ROLE_LABELS: Record<string, string> = {
  // Platform roles (from platform_role enum)
  developer: 'Developer',
  owner: 'Owner',
  admin: 'Admin',
  team_member: 'Team Member',
  collaborator: 'Collaborator',
  // Project roles
  executive: 'Executive',
  production: 'Production',
  management: 'Management',
  crew: 'Crew',
  staff: 'Staff',
  talent: 'Talent',
  vendor: 'Vendor',
  client: 'Client',
  sponsor: 'Sponsor',
  press: 'Press',
  guest: 'Guest',
  attendee: 'Attendee',
};

export const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export default ROLE_OPTIONS;
