'use client';

/**
 * VersionComparison — Side-by-side diff view for proposal versions.
 *
 * Shows phase-level changes (added, removed, modified) between two
 * proposal versions. In production, this reads from the proposal_versions
 * audit table. Currently renders with demo/empty state patterns.
 *
 * @module components/admin/proposals/VersionComparison
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fmTransition } from '@/lib/motion';
import Card from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { GitCompare, Plus, Minus, Edit2, Clock, ArrowRight } from 'lucide-react';
import FormSelect from '@/components/ui/FormSelect';

/* ─── Types ──────────────────────────────────────────────── */

interface VersionSummary {
  version: number;
  createdAt: string;
  totalValue: number;
  phaseCount: number;
  status: string;
}

interface PhaseDiff {
  phaseName: string;
  phaseNumber: string;
  changeType: 'added' | 'removed' | 'modified' | 'unchanged';
  changes: string[];
  oldValue?: number;
  newValue?: number;
}

interface VersionComparisonProps {
  proposalId: string;
  currency?: string;
}

/* ─── Component ──────────────────────────────────────────── */

export default function VersionComparison({
  proposalId,
  currency = 'USD',
}: VersionComparisonProps) {
  const [versions, setVersions] = useState<VersionSummary[]>([]);
  const [selectedFromVersion, setSelectedFromVersion] = useState<number | null>(null);
  const [selectedToVersion, setSelectedToVersion] = useState<number | null>(null);
  const [diffs, setDiffs] = useState<PhaseDiff[]>([]);
  const [loading, setLoading] = useState(true);

  // Load available versions
  useEffect(() => {
    async function loadVersions() {
      try {
        const supabase = createClient();
        // Forward-declared — proposals table pending migration
        const { data } = await (supabase as any)
          .from('proposals')
          .select('version, total_value, created_at, status')
          .eq('id', proposalId)
          .single();

        if (data) {
          // Current version is the only one available until version history table exists
          const currentVersion: VersionSummary = {
            version: data.version ?? 1,
            createdAt: data.created_at,
            totalValue: data.total_value ?? 0,
            phaseCount: 0,
            status: data.status,
          };
          setVersions([currentVersion]);
          setSelectedToVersion(currentVersion.version);
        }
      } catch {
        // Silent — empty state renders
      } finally {
        setLoading(false);
      }
    }
    loadVersions();
  }, [proposalId]);

  const changeTypeIcon = (type: PhaseDiff['changeType']) => {
    switch (type) {
      case 'added': return <Plus size={14} className="text-green-500" />;
      case 'removed': return <Minus size={14} className="text-red-500" />;
      case 'modified': return <Edit2 size={14} className="text-amber-500" />;
      default: return <div className="h-3.5 w-3.5 rounded-full bg-border" />;
    }
  };

  const changeTypeLabel = (type: PhaseDiff['changeType']) => {
    switch (type) {
      case 'added': return 'Added';
      case 'removed': return 'Removed';
      case 'modified': return 'Modified';
      default: return 'Unchanged';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-text-muted">Loading version history…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Version selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1">
              From Version
            </label>
            <FormSelect
              value={selectedFromVersion ?? ''}
              onChange={(e) => setSelectedFromVersion(e.target.value ? Number(e.target.value) : null)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              disabled={versions.length < 2}
            >
              <option value="">Select version…</option>
              {versions.slice(0, -1).map((v) => (
                <option key={v.version} value={v.version}>
                  v{v.version} — {new Date(v.createdAt).toLocaleDateString()}
                </option>
              ))}
            </FormSelect>
          </div>

          <ArrowRight size={16} className="text-text-muted mt-4" />

          <div className="flex-1">
            <label className="block text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1">
              To Version
            </label>
            <FormSelect
              value={selectedToVersion ?? ''}
              onChange={(e) => setSelectedToVersion(e.target.value ? Number(e.target.value) : null)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              disabled={versions.length < 2}
            >
              {versions.map((v) => (
                <option key={v.version} value={v.version}>
                  v{v.version} — {new Date(v.createdAt).toLocaleDateString()} (Current)
                </option>
              ))}
            </FormSelect>
          </div>
        </div>
      </div>

      {/* Version history timeline */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-text-muted" />
          <h3 className="text-sm font-semibold text-foreground">Version History</h3>
        </div>

        {versions.length === 1 ? (
          <div className="text-center py-8">
            <GitCompare size={28} className="mx-auto text-text-muted mb-3" />
            <p className="text-sm text-text-secondary">Only one version exists</p>
            <p className="text-xs text-text-muted mt-1">
              Version comparison will be available once the proposal is saved as a new version.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {versions.map((v, i) => (
              <motion.div
                key={v.version}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, ...fmTransition }}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-bg-secondary/50 transition-colors"
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === 0 ? 'bg-foreground text-background' : 'bg-bg-secondary text-text-secondary'
                }`}>
                  v{v.version}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Version {v.version}
                    {v.status && (
                      <span className="ml-2 text-xs text-text-muted">({v.status})</span>
                    )}
                  </p>
                  <p className="text-xs text-text-muted">
                    {new Date(v.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <p className="text-sm font-medium tabular-nums text-foreground">
                  {formatCurrency(v.totalValue, currency)}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      {/* Diff view */}
      {diffs.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <GitCompare size={16} className="text-text-muted" />
            <h3 className="text-sm font-semibold text-foreground">
              Changes: v{selectedFromVersion} → v{selectedToVersion}
            </h3>
          </div>

          <div className="space-y-3">
            {diffs.map((diff, i) => (
              <motion.div
                key={diff.phaseName}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, ...fmTransition }}
                className={`rounded-lg border p-4 ${
                  diff.changeType === 'added' ? 'border-green-200 bg-green-50/30' :
                  diff.changeType === 'removed' ? 'border-red-500/30 bg-red-500/5' :
                  diff.changeType === 'modified' ? 'border-amber-200 bg-amber-50/30' :
                  'border-border'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {changeTypeIcon(diff.changeType)}
                  <span className="text-sm font-medium text-foreground">
                    Phase {diff.phaseNumber}: {diff.phaseName}
                  </span>
                  <span className={`text-[10px] font-medium uppercase tracking-wider ${
                    diff.changeType === 'added' ? 'text-green-600' :
                    diff.changeType === 'removed' ? 'text-red-500' :
                    diff.changeType === 'modified' ? 'text-amber-600' :
                    'text-text-muted'
                  }`}>
                    {changeTypeLabel(diff.changeType)}
                  </span>
                </div>

                {diff.changes.length > 0 && (
                  <ul className="space-y-1 ml-6">
                    {diff.changes.map((change, ci) => (
                      <li key={ci} className="text-xs text-text-secondary">{change}</li>
                    ))}
                  </ul>
                )}

                {diff.oldValue != null && diff.newValue != null && diff.oldValue !== diff.newValue && (
                  <p className="mt-2 ml-6 text-xs">
                    <span className="text-red-500 line-through">{formatCurrency(diff.oldValue, currency)}</span>
                    {' → '}
                    <span className="text-green-600 font-medium">{formatCurrency(diff.newValue, currency)}</span>
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
