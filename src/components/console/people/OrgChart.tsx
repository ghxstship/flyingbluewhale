'use client';

import { useEffect, useState } from 'react';
import { resolveClientOrg } from '@/lib/auth/resolve-org-client';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import { castRelation } from '@/lib/supabase/cast-relation';
import OrgChartPositionModal from './OrgChartPositionModal';

interface OrgNode {
  id: string;
  name: string;
  title: string;
  department: string | null;
  reports_to: string | null;
  user_id: string | null;
  children: OrgNode[];
}

function OrgNodeCard({ node, isRoot = false, onClick }: { node: OrgNode; isRoot?: boolean; onClick?: (node: OrgNode) => void }) {
  return (
    <div className="flex flex-col items-center group relative">
      <button 
        className={`rounded-xl border border-border bg-background px-5 py-3 text-center transition-all hover:border-primary hover:shadow-sm text-left ${isRoot ? 'shadow-md' : ''}`}
        onClick={() => onClick?.(node)}
      >
        <p className="text-sm font-medium text-foreground">{node.name}</p>
        <p className="text-xs text-text-secondary">{node.title}</p>
        {node.department && <p className="text-[10px] text-text-muted mt-1 uppercase tracking-wider">{node.department}</p>}
      </button>

      {node.children.length > 0 && (
        <>
          <div className="w-px h-6 bg-border" />
          <div className="flex gap-8 relative">
            {node.children.length > 1 && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px bg-border" style={{
                width: `calc(100% - 80px)`,
              }} />
            )}
            {node.children.map((child) => (
              <div key={child.id} className="flex flex-col items-center">
                <div className="w-px h-6 bg-border" />
                <OrgNodeCard node={child} onClick={onClick} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function buildOrgTree(positions: OrgNode[]): OrgNode | null {
  if (positions.length === 0) return null;

  const nodeMap = new Map<string, OrgNode>();

  for (const pos of positions) {
    nodeMap.set(pos.id, {
      ...pos,
      children: [],
    });
  }

  let root: OrgNode | null = null;

  for (const pos of positions) {
    const node = nodeMap.get(pos.id)!;
    if (pos.reports_to && nodeMap.has(pos.reports_to)) {
      nodeMap.get(pos.reports_to)!.children.push(node);
    } else {
      root = node; // the last node without reports_to is assumed root if multiple exist
    }
  }

  return root ?? nodeMap.values().next().value ?? null;
}

export default function OrgChart() {
  const [allPositions, setAllPositions] = useState<OrgNode[]>([]);
  const [orgTree, setOrgTree] = useState<OrgNode | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<OrgNode | undefined>(undefined);

  async function loadOrg() {
    try {
      const ctx = await resolveClientOrg();
      if (!ctx) return;

      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore — org_chart_positions table is forward-declared; migration pending
      const { data: positions } = await (supabase as any).from('org_chart_positions').select('id, title, department, reports_to, user_id, users!org_chart_positions_user_id_fkey(full_name)').eq('organization_id', ctx.organizationId).order('level', { ascending: true });

      if (positions && positions.length > 0) {
        const mapped: OrgNode[] = positions.map((p: any) => {
          const user = castRelation<{ full_name: string }>(p.users);
          return {
            id: p.id,
            title: p.title,
            department: p.department,
            reports_to: p.reports_to,
            user_id: p.user_id,
            name: user?.full_name ?? 'Vacant',
            children: []
          };
        });
        setAllPositions(mapped);
        setOrgTree(buildOrgTree(mapped));
      } else {
        setAllPositions([]);
        setOrgTree(null);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrg();
  }, []);

  const openAddModal = () => {
    setSelectedPosition(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (node: OrgNode) => {
    setSelectedPosition(node);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="flex justify-end mb-6">
        <Button onClick={openAddModal}>Add Position</Button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-background px-8 py-8 text-center">
          <p className="text-sm text-text-muted">Loading organization chart...</p>
        </div>
      ) : !orgTree ? (
        <EmptyState
          message="No org chart positions configured yet"
          description="Click Add Position to start building your organizational hierarchy."
        />
      ) : (
        <div className="rounded-xl border border-border bg-background px-8 py-8 overflow-x-auto min-h-[400px]">
          <div className="min-w-[600px] flex justify-center mt-4">
            <OrgNodeCard node={orgTree} isRoot onClick={openEditModal} />
          </div>
        </div>
      )}

      {isModalOpen && (
        <OrgChartPositionModal 
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          position={selectedPosition}
          allPositions={allPositions}
          onSaved={() => {
            setLoading(true);
            loadOrg();
          }}
        />
      )}
    </>
  );
}
