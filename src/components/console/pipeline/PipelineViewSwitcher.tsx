'use client';

import { useState } from 'react';
import PipelineBoard from './PipelineBoard';
import PipelineTable from './PipelineTable';
import ViewTypeSwitcher, { getPersistedView } from '@/components/shared/ViewTypeSwitcher';
import type { Deal } from '@/types/database';
import { Kanban, Table } from 'lucide-react';

type DealWithClient = Deal & { client_name: string; owner_name: string | null };

const PERSIST_KEY = 'opusone:view:pipeline';

const PIPELINE_VIEWS = [
  { key: 'board', label: 'Board', icon: <Kanban size={13} /> },
  { key: 'table', label: 'Table', icon: <Table size={13} /> },
] as const;

type ViewType = typeof PIPELINE_VIEWS[number]['key'];

export default function PipelineViewSwitcher({ deals }: { deals: DealWithClient[] }) {
  const [view, setView] = useState<ViewType>(() =>
    getPersistedView(PERSIST_KEY, ['board', 'table'], 'board') as ViewType,
  );

  const tableDeals = deals.map((d) => ({
    id: d.id,
    title: d.title,
    client_name: d.client_name,
    value: d.deal_value,
    stage: d.stage,
    probability: d.probability ?? 0,
    expected_close: d.expected_close_date ?? null,
    owner_name: d.owner_name ?? null,
  }));

  return (
    <>
      {/* View toggle */}
      <div className="mb-6">
        <ViewTypeSwitcher
          views={[...PIPELINE_VIEWS]}
          activeView={view}
          onSwitch={(key: string) => setView(key as ViewType)}
          persistKey={PERSIST_KEY}
        />
      </div>

      {view === 'board' ? (
        <PipelineBoard initialDeals={deals} />
      ) : (
        <PipelineTable deals={tableDeals} />
      )}
    </>
  );
}
