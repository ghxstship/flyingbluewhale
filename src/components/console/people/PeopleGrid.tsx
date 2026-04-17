'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getInitials } from '@/lib/utils';
import DataExportMenu from '@/components/shared/DataExportMenu';
import DataImportDialog from '@/components/shared/DataImportDialog';
import PersonEditModal from './PersonEditModal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import RowActionMenu from '@/components/shared/RowActionMenu';
import { Badge } from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';

import { ROLE_BADGE_COLORS } from '@/components/ui/StatusBadge';
import { ROLE_LABELS } from '@/config/roles';
import SearchInput from '@/components/ui/SearchInput';
import Button from '@/components/ui/Button';
import { Upload } from 'lucide-react';
import { useEntityViews } from '@/hooks/useEntityViews';
import ViewBar from '@/components/shared/ViewBar';

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  title: string | null;
  department: string | null;
  facility: string | null;
  rate_card: string | null;
  avatar_url: string | null;
}

export default function PeopleGrid({ members }: { members: TeamMember[] }) {
  const [search, setSearch] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [editPerson, setEditPerson] = useState<TeamMember | null>(null);
  const [deletePerson, setDeletePerson] = useState<TeamMember | null>(null);
  const router = useRouter();

  const {
    views,
    activeView,
    activeViewId,
    setActiveViewId,
    createView,
    deleteView,
    duplicateView,
  } = useEntityViews({ entityType: 'people' });

  const filtered = useMemo(() => {
    if (!search) return members;
    const q = search.toLowerCase();
    return members.filter(
      (m) =>
        m.full_name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.title && m.title.toLowerCase().includes(q)) ||
        m.role.toLowerCase().includes(q),
    );
  }, [members, search]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDeletePerson(person: TeamMember) {
    setDeleteError(null);
    const res = await fetch(`/api/settings/team/${person.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setDeleteError(data.error || 'Failed to remove team member');
      return;
    }
    setDeletePerson(null);
    router.refresh();
  }

  return (
    <>
      {/* Toolbar */}
      {deleteError && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-800 flex items-center justify-between">
          <span>{deleteError}</span>
          <button onClick={() => setDeleteError(null)} className="text-red-600 hover:text-red-800 text-lg leading-none">&times;</button>
        </div>
      )}
      <div className="mb-6 flex flex-col gap-4">
        {/* Top row: Views & Main Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <ViewBar
            views={views}
            activeViewId={activeViewId}
            onSelectView={setActiveViewId}
            onCreateView={(opts) => createView({
              name: opts.name,
              display_type: opts.display_type,
              config: opts.inherit ? activeView?.config : {}
            })}
            onDeleteView={deleteView}
            onDuplicateView={duplicateView}
          />
          <div className="flex items-center gap-3">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search people..."
            />
            <Button variant="secondary" size="sm" onClick={() => setShowImport(true)}>
              <Upload size={14} />
              Import
            </Button>
            <DataExportMenu data={filtered} entityKey="people" filename="people-export" entityType="People" />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          message={search ? 'No results found' : 'No team members yet'}
          description={search ? 'Try a different search term.' : 'Invite your first team member to start collaborating.'}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedItems.map((member) => (
              <div
                key={member.id}
                className="group relative rounded-xl border border-border bg-background px-6 py-5 transition-[color,background-color,border-color,opacity,box-shadow,transform] duration-normal hover:shadow-md hover:-translate-y-0.5"
              >
                {/* Action menu */}
                <div className="absolute top-3 right-3 z-10">
                  <RowActionMenu actions={[
                    { label: 'View', onClick: () => router.push(`/app/people/${member.id}`) },
                    { label: 'Edit', onClick: () => setEditPerson(member) },
                    { label: 'Remove', variant: 'danger', onClick: () => setDeletePerson(member) },
                  ]} />
                </div>

                <Link href={`/app/people/${member.id}`}>
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-bg-tertiary">
                     {member.avatar_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={member.avatar_url} alt={member.full_name} className="h-full w-full rounded-full object-cover" />
                      ) : (
                        <span className="text-sm font-semibold text-text-secondary">{getInitials(member.full_name)}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate group-hover:underline">{member.full_name}</p>
                      <p className="text-xs text-text-muted mt-0.5 truncate">{member.title ?? member.role.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 relative z-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-muted">Role</span>
                      <Badge variant="muted" className={ROLE_BADGE_COLORS[member.role] ?? 'bg-bg-secondary text-text-secondary'}>
                        {ROLE_LABELS[member.role] ?? member.role}
                      </Badge>
                    </div>
                    {member.department && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-muted">Department</span>
                        <span className="text-xs text-foreground text-right truncate ml-4 py-0.5">{member.department}</span>
                      </div>
                    )}
                    {member.facility && (
                      <div className="flex items-center justify-between border-t border-border/50 pt-1.5 mt-1.5">
                        <span className="text-xs text-text-muted">Facility</span>
                        <span className="text-xs text-foreground text-right truncate ml-4 py-0.5">{member.facility}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between border-t border-border/50 pt-1.5 mt-1.5">
                      <span className="text-xs text-text-muted">Rate</span>
                      <span className="text-xs font-medium text-foreground tabular-nums py-0.5">{member.rate_card ?? '\u2014'}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border/50 pt-1.5 mt-1.5">
                      <span className="text-xs text-text-muted">Email</span>
                      <span className="text-xs text-text-secondary truncate ml-4 py-0.5">{member.email}</span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <span className="text-sm text-text-secondary">
                Showing {Math.min(filtered.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(filtered.length, currentPage * itemsPerPage)} of {filtered.length} entries
              </span>
              <div className="flex items-center gap-2">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <DataImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        entityType="People"
        entityKey="people"
        apiEndpoint="/api/settings/team"
        onComplete={() => router.refresh()}
      />

      {editPerson && (
        <PersonEditModal
          open
          person={editPerson}
          onClose={() => setEditPerson(null)}
          onSaved={() => { setEditPerson(null); router.refresh(); }}
        />
      )}

      {deletePerson && (
        <ConfirmDialog
          open
          title="Remove Team Member"
          message={`Are you sure you want to remove ${deletePerson.full_name} from the organization? They will lose access to all resources.`}
          confirmLabel="Remove"
          variant="danger"
          onConfirm={() => handleDeletePerson(deletePerson)}
          onCancel={() => setDeletePerson(null)}
        />
      )}
    </>
  );
}
