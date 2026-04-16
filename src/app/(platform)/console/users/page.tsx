import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Users & Roles -- GVTEWAY',
  description: 'Manage organization members and role assignments.',
};

const roleDescriptions: Record<string, string> = {
  developer: 'Full system access, can modify schema and settings',
  owner: 'Organization owner, full admin rights',
  admin: 'Administrative access, manage members and projects',
  team_member: 'Internal team, manage assigned projects',
  talent_management: 'Artist management, submit on behalf of talent',
  talent_performer: 'Performing artist, submit own deliverables',
  talent_crew: 'Touring crew member, limited deliverable access',
  vendor: 'External vendor, submit production deliverables',
  client: 'Client stakeholder, review and approve',
  sponsor: 'Sponsor representative, brand activation portal',
  industry_guest: 'Industry guest, read-only access',
};

export default async function UsersPage() {
  const supabase = await createClient();

  const { data: members } = await supabase
    .from('organization_members')
    .select(`
      *,
      profiles (full_name, display_name, avatar_url)
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-8 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-heading text-lg text-text-primary">Users & Roles</h1>
            <p className="text-sm text-text-secondary mt-1">{members?.length ?? 0} members &middot; 11 roles</p>
          </div>
          <button className="btn btn-primary text-xs py-2 px-4">Invite Member</button>
        </div>
      </header>

      <div className="flex-1 px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Role Reference */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-6 bg-cyan rounded-full" />
              <h2 className="text-heading text-sm text-text-primary">RBAC Role Hierarchy</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(roleDescriptions).map(([role, desc]) => {
                const isInternal = ['developer', 'owner', 'admin', 'team_member'].includes(role);
                const isTalent = ['talent_management', 'talent_performer', 'talent_crew'].includes(role);

                return (
                  <div key={role} className="card-elevated p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge border ${isInternal ? 'text-cyan border-cyan/20 bg-cyan-subtle' : isTalent ? 'text-info border-info/30 bg-info/10' : 'text-text-secondary border-border bg-surface-raised'}`}>
                        {role.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-text-tertiary">{desc}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Members Table */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-6 bg-cyan rounded-full" />
              <h2 className="text-heading text-sm text-text-primary">Organization Members</h2>
            </div>

            {(members?.length ?? 0) === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-text-tertiary text-sm mb-2">No members yet</p>
                <p className="text-text-disabled text-xs">Invite team members, talent, vendors, and clients</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th className="w-24" />
                  </tr>
                </thead>
                <tbody>
                  {members?.map((member) => {
                    const profile = member.profiles as { full_name?: string; display_name?: string } | null;
                    return (
                      <tr key={member.id}>
                        <td className="text-text-primary">{profile?.display_name || profile?.full_name || 'Unknown'}</td>
                        <td><span className="badge border text-cyan border-cyan/20 bg-cyan-subtle">{member.role.replace(/_/g, ' ')}</span></td>
                        <td className="text-text-tertiary text-xs">{new Date(member.created_at).toLocaleDateString()}</td>
                        <td><button className="btn btn-ghost text-xs py-1 px-3">Edit</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
