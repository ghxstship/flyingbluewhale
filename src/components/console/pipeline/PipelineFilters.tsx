'use client';

import { useState } from 'react';
import FormSelect from '@/components/ui/FormSelect';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';

export interface PipelineFilterValues {
  owner: string;
  minProbability: number;
  maxProbability: number;
  dateFrom: string;
  dateTo: string;
}

interface PipelineFiltersProps {
  onFilterChange: (filters: PipelineFilterValues) => void;
  owners: string[];
}

export default function PipelineFilters({ onFilterChange, owners }: PipelineFiltersProps) {
  const [filters, setFilters] = useState<PipelineFilterValues>({
    owner: 'all',
    minProbability: 0,
    maxProbability: 100,
    dateFrom: '',
    dateTo: '',
  });

  function update(patch: Partial<PipelineFilterValues>) {
    const next = { ...filters, ...patch };
    setFilters(next);
    onFilterChange(next);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div>
        <FormLabel>Owner</FormLabel>
        <FormSelect
          value={filters.owner}
          onChange={(e) => update({ owner: e.target.value })}
        >
          <option value="all">All owners</option>
          {owners.map((owner) => (
            <option key={owner} value={owner}>
              {owner}
            </option>
          ))}
        </FormSelect>
      </div>
      <div>
        <FormLabel>Min probability</FormLabel>
        <FormInput
          type="number"
          min={0}
          max={100}
          value={filters.minProbability}
          onChange={(e) => update({ minProbability: Number(e.target.value) })} />
      </div>
      <div>
        <FormLabel>Max probability</FormLabel>
        <FormInput
          type="number"
          min={0}
          max={100}
          value={filters.maxProbability}
          onChange={(e) => update({ maxProbability: Number(e.target.value) })} />
      </div>
      <div>
        <FormLabel>From</FormLabel>
        <FormInput
          type="date"
          value={filters.dateFrom}
          onChange={(e) => update({ dateFrom: e.target.value })} />
      </div>
      <div>
        <FormLabel>To</FormLabel>
        <FormInput
          type="date"
          value={filters.dateTo}
          onChange={(e) => update({ dateTo: e.target.value })} />
      </div>
    </div>
  );
}
