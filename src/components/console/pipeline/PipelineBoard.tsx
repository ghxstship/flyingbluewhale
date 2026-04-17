'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import DealCard from './DealCard';
import PipelineFilters, { type PipelineFilterValues } from './PipelineFilters';
import { formatCurrency } from '@/lib/utils';
import type { Deal, DealStage } from '@/types/database';

const STAGE_LABELS: Record<string, string> = {
  lead: 'Lead',
  qualified: 'Qualified',
  proposal_sent: 'Proposal Sent',
  negotiation: 'Negotiation',
  verbal_yes: 'Verbal Yes',
  contract_signed: 'Contract Signed',
};

const ACTIVE_STAGES: DealStage[] = [
  'lead',
  'qualified',
  'proposal_sent',
  'negotiation',
  'verbal_yes',
  'contract_signed',
];

interface DealWithClient extends Deal {
  client_name: string;
  owner_name: string | null;
}

function DroppableColumn({
  stage,
  children,
  count,
  totalValue,
}: {
  stage: string;
  children: React.ReactNode;
  count: number;
  totalValue: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-72 rounded-xl border bg-bg-secondary ${
        isOver ? 'border-foreground/30 bg-bg-tertiary' : 'border-border'
      }`}
    >
      <div className="px-3 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            {STAGE_LABELS[stage] ?? stage}
          </h3>
          <span className="inline-flex items-center justify-center rounded-full bg-bg-tertiary px-2 py-0.5 text-xs font-medium text-text-secondary">
            {count}
          </span>
        </div>
        <p className="mt-1 text-xs tabular-nums text-text-muted">
          {formatCurrency(totalValue)}
        </p>
      </div>
      <div className="p-2 space-y-2 min-h-[120px]">{children}</div>
    </div>
  );
}

function DraggableDealCard({ deal }: { deal: DealWithClient }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : ''}`}
    >
      <DealCard
        id={deal.id}
        title={deal.title}
        clientName={deal.client_name}
        value={deal.deal_value}
        probability={deal.probability}
        expectedCloseDate={deal.expected_close_date}
        stage={deal.stage}
        updatedAt={deal.updated_at}
        ownerName={deal.owner_name}
      />
    </div>
  );
}

export default function PipelineBoard({
  initialDeals,
}: {
  initialDeals: DealWithClient[];
}) {
  const [deals, setDeals] = useState(initialDeals);
  const [activeDeal, setActiveDeal] = useState<DealWithClient | null>(null);
  const [filters, setFilters] = useState<PipelineFilterValues>({
    owner: 'all',
    minProbability: 0,
    maxProbability: 100,
    dateFrom: '',
    dateTo: '',
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const deal = deals.find((d) => d.id === event.active.id);
      setActiveDeal(deal ?? null);
    },
    [deals]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDeal(null);
      const { active, over } = event;
      if (!over) return;

      const newStage = over.id as DealStage;
      if (!ACTIVE_STAGES.includes(newStage)) return;

      // Optimistic update
      setDeals((prev) =>
        prev.map((d) =>
          d.id === active.id ? { ...d, stage: newStage } : d
        )
      );

      // Persist to API
      fetch(`/api/deals/${active.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      }).catch(() => {
        // Revert on failure
        setDeals((prev) =>
          prev.map((d) =>
            d.id === active.id
              ? { ...d, stage: initialDeals.find((id) => id.id === active.id)?.stage ?? d.stage }
              : d
          )
        );
      });
    },
    [initialDeals]
  );

  const handleFilterChange = useCallback((f: PipelineFilterValues) => {
    setFilters(f);
  }, []);

  // Compute dynamic options for filters
  const uniqueOwners = Array.from(
    new Set(deals.map((d) => d.owner_name).filter((n): n is string => Boolean(n)))
  ).sort();

  // Apply filters
  const filteredDeals = deals.filter((d) => {
    if (filters.owner !== 'all' && d.owner_name !== filters.owner) return false;
    if (d.probability < filters.minProbability) return false;
    if (d.probability > filters.maxProbability) return false;
    if (filters.dateFrom && d.expected_close_date && new Date(d.expected_close_date) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && d.expected_close_date && new Date(d.expected_close_date) > new Date(filters.dateTo)) return false;
    return true;
  });

  // Group filtered deals by stage
  const grouped = ACTIVE_STAGES.reduce<Record<DealStage, DealWithClient[]>>(
    (acc, stage) => {
      acc[stage] = filteredDeals.filter((d) => d.stage === stage);
      return acc;
    },
    {} as Record<DealStage, DealWithClient[]>
  );

  const totalPipelineValue = filteredDeals
    .filter((d) => d.stage !== 'contract_signed')
    .reduce((sum, d) => sum + d.deal_value * (d.probability / 100), 0);

  return (
    <div>
      <div className="mb-6">
        <PipelineFilters onFilterChange={handleFilterChange} owners={uniqueOwners} />
      </div>

      <div className="mb-4 flex items-center gap-6">
        <div>
          <p className="text-xs text-text-muted">Weighted pipeline</p>
          <p className="text-lg font-semibold tabular-nums text-foreground">
            {formatCurrency(totalPipelineValue)}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-muted">Filtered deals</p>
          <p className="text-lg font-semibold tabular-nums text-foreground">
            {filteredDeals.length}
          </p>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {ACTIVE_STAGES.map((stage) => {
            const stageDeals = grouped[stage] ?? [];
            const stageValue = stageDeals.reduce((s, d) => s + d.deal_value, 0);
            return (
              <DroppableColumn
                key={stage}
                stage={stage}
                count={stageDeals.length}
                totalValue={stageValue}
              >
                {stageDeals.map((deal) => (
                  <DraggableDealCard key={deal.id} deal={deal} />
                ))}
              </DroppableColumn>
            );
          })}
        </div>

        <DragOverlay>
          {activeDeal ? (
            <div className="opacity-80">
              <DealCard
                id={activeDeal.id}
                title={activeDeal.title}
                clientName={activeDeal.client_name}
                value={activeDeal.deal_value}
                probability={activeDeal.probability}
                expectedCloseDate={activeDeal.expected_close_date}
                stage={activeDeal.stage}
                updatedAt={activeDeal.updated_at}
                ownerName={activeDeal.owner_name}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
