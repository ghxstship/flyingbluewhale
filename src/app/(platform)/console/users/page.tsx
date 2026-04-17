import { createClient } from '@/lib/supabase/server';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { SectionHeading } from '@/components/data/SectionHeading';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export const metadata = {
  title: 'Users & Roles -- GVTEWAY',
  description: 'Manage organization members and role assignments.',
};

const platformRoleDescriptions: Record<string, string> = {
  developer: 'Full system access, can modify schema and settings',
  owner: 'Organization owner, full admin rights',
  admin: 'Administrative access, manage members and projects',
  team_member: 'Internal team, manage assigned projects',
  collaborator: 'External stakeholder with org-level access',
};

const projectRoleDescriptions: Record<string, string> = {
  executive: 'Full project authority — build, strike, day of show',
  production: 'Operations lead — build & strike + day of show',
  management: 'Day of show, load-in/out access, no build & strike',
  crew: 'Build & strike + day of show operations',
  staff: 'Day of show only, no build & strike',
  talent: 'Performers, speakers, artists — submit deliverables',
  vendor: 'External vendor, submit production deliverables',
  client: 'Client stakeholder, review and approve',
  sponsor: 'Sponsor representative, brand activation portal',
  press: 'Press and media credentials, limited access',
  guest: 'Guest access, read-only portal',
  attendee: 'Attendee-level access, minimal portal',
};

type MemberRow = {
  id: string;
  role: string;
  created_at: string;
  profiles: { full_name?: string; display_name?: string } | null;
};

const MEMBER_COLUMNS: DataTableColumn<MemberRow>[] = [
  {
    key: 'name',
    header: 'Name',
    render: (m) => <span className="text-text-primary">{m.profiles?.display_name || m.profiles?.full_name || 'Unknown'}</span>,
  },
  {
    key: 'role',
    header: 'Role',
    render: (m) => <Badge variant="cyan">{m.role.replace(/_/g, ' ')}</Badge>,
  },
  {
    key: 'joined',
    header: 'Joined',
    render: (m) => <span className="text-text-tertiary text-xs">{new Date(m.created_at).toLocaleDateString()}</span>,
  },
  {
    key: 'actions',
    header: '',
    align: 'right',
    render: () => <Button variant="ghost" size="sm">Edit</Button>,
  },
];

export default async function UsersPage() {
  const supabase = await createClient();
  const { data: members } = await supabase
    .from('organization_members')
    .select(`
      *,
      profiles (full_name, display_name, avatar_url)
    `)
    .order('created_at', { ascending: false });

  const typedMembers = (members ?? []) as MemberRow[];

  return (
    <>
      <ModuleHeader
        title="Users & Roles"
        subtitle={`${typedMembers.length} members · 5 platform + 12 project roles`}
        maxWidth="6xl"
      >
        <Button variant="primary" size="sm">Invite Member</Button>
      </ModuleHeader>

      <div className="page-content" style={{ maxWidth: '6xl' }}>
        
        {/* Platform Role Reference */}
        <section className="mb-10">
          <SectionHeading accentColor="var(--color-cyan)">Platform Roles (Internal)</SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(platformRoleDescriptions).map(([role, desc]) => (
              <div key={role} className="card-elevated p-4">
                <div className="mb-2">
                  <Badge variant="cyan">{role.replace(/_/g, ' ')}</Badge>
                </div>
                <p className="text-xs text-text-tertiary">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Project Role Reference */}
        <section className="mb-10">
          <SectionHeading accentColor="var(--color-info)">Project Roles (External)</SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(projectRoleDescriptions).map(([role, desc]) => {
              const isOps = ['executive', 'production', 'management', 'crew', 'staff'].includes(role);
              return (
                <div key={role} className="card-elevated p-4">
                  <div className="mb-2">
                    <Badge variant={isOps ? 'info' : 'muted'}>{role.replace(/_/g, ' ')}</Badge>
                  </div>
                  <p className="text-xs text-text-tertiary">{desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Members Table */}
        <section>
          <SectionHeading>Organization Members</SectionHeading>
          <DataTable
            columns={MEMBER_COLUMNS}
            data={typedMembers}
            emptyText="No members yet"
          />
        </section>
        
      </div>
    </>
  );
}
