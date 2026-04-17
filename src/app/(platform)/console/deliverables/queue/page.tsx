import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { EmptyState } from '@/components/data/EmptyState';
import { StatusBadge } from '@/components/data/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export const metadata = { title: 'Approval Queue -- GVTEWAY' };

export default async function ApprovalQueuePage() {
  const supabase = await createClient();
  const { data: pending } = await supabase
    .from('deliverables')
    .select(`*, projects (name, slug), acts (name, artist_name)`)
    .in('status', ['submitted', 'in_review'])
    .order('deadline', { ascending: true, nullsFirst: false })
    .order('updated_at', { ascending: false });

  return (
    <>
      <ModuleHeader
        title="Approval Queue"
        subtitle={`${pending?.length ?? 0} awaiting review`}
        backHref="/console/deliverables"
        backLabel="All Deliverables"
      >
        <Button variant="primary" size="sm">Bulk Approve</Button>
        <Button variant="danger" size="sm" className="bg-transparent border border-[rgba(239,68,68,0.3)]">
          Bulk Reject
        </Button>
      </ModuleHeader>

      <div className="page-content">
        {(pending?.length ?? 0) === 0 ? (
          <EmptyState 
            title="Queue Empty" 
            description="All deliverables reviewed"
            icon={<span className="text-[#22C55E]">✓</span>}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {pending?.map((d) => {
              const project = d.projects as { name: string; slug: string } | null;
              const act = d.acts as { name: string; artist_name: string } | null;
              const isUrgent = d.deadline && new Date(d.deadline).getTime() - Date.now() < 86400000 * 3;
              
              return (
                <Link 
                  key={d.id} 
                  href={`/console/deliverables/${d.id}`} 
                  className="card p-4 flex items-center gap-4 no-underline hover:border-cyan transition-colors"
                >
                  <input 
                    type="checkbox" 
                    className="accent-cyan shrink-0" 
                    onClick={(e) => e.stopPropagation()} 
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-text-primary font-medium">
                        {d.title || d.type.replace(/_/g, ' ')}
                      </span>
                      <StatusBadge status={d.status} />
                      {isUrgent && <Badge variant="error">Urgent</Badge>}
                    </div>
                    <p className="text-xs text-text-tertiary mt-1">
                      {project?.name} {act ? `· ${act.artist_name}` : ''} · v{d.version}
                    </p>
                  </div>
                  {d.deadline && (
                    <div className="text-right shrink-0">
                      <div className={`font-mono text-xs ${isUrgent ? 'text-[#EF4444]' : 'text-text-tertiary'}`}>
                        {new Date(d.deadline).toLocaleDateString()}
                      </div>
                      <div className="text-[0.5625rem] text-text-disabled">deadline</div>
                    </div>
                  )}
                  <span className="text-text-disabled text-base">&rarr;</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
