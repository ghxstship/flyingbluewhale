/** Role configuration — labels and display options */

export const ROLE_LABELS: Record<string, string> = {
  // Platform roles
  developer: 'Developer',
  owner: 'Owner',
  admin: 'Admin',
  team_member: 'Team Member',
  collaborator: 'Collaborator',
  controller: 'Controller',
  contractor: 'Contractor',
  crew: 'Crew',
  client: 'Client',
  viewer: 'Viewer',
  community: 'Community',
  // Project roles
  executive: 'Executive',
  production: 'Production',
  management: 'Management',
  staff: 'Staff',
  talent: 'Talent',
  vendor: 'Vendor',
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
