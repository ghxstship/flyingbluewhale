'use client';

/**
 * ProposalAnalytics — Engagement tracking dashboard for a single proposal.
 *
 * Shows view counts, time-on-page, section heatmap, and acceptance timeline.
 * In production, this reads from proposal_analytics and proposal_events tables.
 * Currently renders with demo/empty state patterns.
 *
 * @module components/admin/proposals/ProposalAnalytics
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { fmTransition } from '@/lib/motion';
import Card from '@/components/ui/Card';
import { Eye, Clock, BarChart3, MousePointer, TrendingUp, Users } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

/* ─── Types ──────────────────────────────────────────────── */

interface AnalyticsMetric {
  label: string;
  value: string;
  subtext: string;
  icon: React.ReactNode;
  delta?: string;
  trend?: 'up' | 'down' | 'flat';
}

interface SectionHeatRow {
  section: string;
  views: number;
  avgTime: string;
  scrollDepth: number;
}

interface TimelineEvent {
  id: string;
  type: 'viewed' | 'commented' | 'addon_toggled' | 'accepted' | 'shared';
  description: string;
  timestamp: string;
  actor: string;
}

interface ProposalAnalyticsProps {
  proposalId: string;
  proposalName: string;
}

/* ─── Component ──────────────────────────────────────────── */

export default function ProposalAnalytics({
  proposalId,
  proposalName,
}: ProposalAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');

  // Demo metrics — in production, these come from Supabase
  const metrics: AnalyticsMetric[] = [
    {
      label: 'Total Views',
      value: '—',
      subtext: 'Unique sessions',
      icon: <Eye size={18} className="text-blue-500" />,
      delta: '',
      trend: 'flat',
    },
    {
      label: 'Avg. Time on Proposal',
      value: '—',
      subtext: 'Per session',
      icon: <Clock size={18} className="text-emerald-500" />,
    },
    {
      label: 'Engagement Score',
      value: '—',
      subtext: 'Based on interactions',
      icon: <TrendingUp size={18} className="text-amber-500" />,
    },
    {
      label: 'Unique Viewers',
      value: '—',
      subtext: 'Distinct contacts',
      icon: <Users size={18} className="text-purple-500" />,
    },
  ];

  const heatmapData: SectionHeatRow[] = [];
  const timeline: TimelineEvent[] = [];

  return (
    <div className="space-y-8">
      {/* Time range filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Engagement Analytics</h2>
        <div className="flex rounded-lg border border-border overflow-hidden">
          {(['7d', '30d', 'all'] as const).map((range) => (
            <Button
              key={range}
              type="button"
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                timeRange === range
                  ? 'bg-foreground text-background'
                  : 'bg-background text-text-secondary hover:bg-bg-secondary'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : 'All Time'}
            </Button>
          ))}
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, ...fmTransition }}
          >
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-secondary">
                  {metric.icon}
                </div>
              </div>
              <p className="text-2xl font-semibold tabular-nums text-foreground">{metric.value}</p>
              <p className="text-xs text-text-muted mt-1">{metric.label}</p>
              <p className="text-[10px] text-text-muted">{metric.subtext}</p>
              {metric.delta && (
                <p className={`text-[10px] font-medium mt-1 ${
                  metric.trend === 'up' ? 'text-green-600' :
                  metric.trend === 'down' ? 'text-red-500' : 'text-text-muted'
                }`}>
                  {metric.delta}
                </p>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Section heatmap */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={16} className="text-text-muted" />
          <h3 className="text-sm font-semibold text-foreground">Section Heatmap</h3>
        </div>
        {heatmapData.length > 0 ? (
          <Table >
            <TableHeader>
              <TableRow className="text-left text-xs text-text-muted border-b border-border">
                <TableHead className="py-2 font-medium">Section</TableHead>
                <TableHead className="py-2 font-medium text-right">Views</TableHead>
                <TableHead className="py-2 font-medium text-right">Avg Time</TableHead>
                <TableHead className="py-2 font-medium text-right">Scroll Depth</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {heatmapData.map((row) => (
                <TableRow key={row.section} className="border-b border-border/50">
                  <TableCell className="py-2.5 text-foreground">{row.section}</TableCell>
                  <TableCell className="py-2.5 text-right tabular-nums">{row.views}</TableCell>
                  <TableCell className="py-2.5 text-right tabular-nums text-text-secondary">{row.avgTime}</TableCell>
                  <TableCell className="py-2.5 text-right">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: `${row.scrollDepth}%` }}
                        />
                      </div>
                      <span className="text-xs tabular-nums text-text-muted">{row.scrollDepth}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12">
            <BarChart3 size={28} className="mx-auto text-text-muted mb-3" />
            <p className="text-sm text-text-secondary">No engagement data yet</p>
            <p className="text-xs text-text-muted mt-1">
              Section heatmap data will appear once the proposal is shared with clients.
            </p>
          </div>
        )}
      </Card>

      {/* Activity timeline */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <MousePointer size={16} className="text-text-muted" />
          <h3 className="text-sm font-semibold text-foreground">Activity Timeline</h3>
        </div>
        {timeline.length > 0 ? (
          <div className="space-y-3">
            {timeline.map((event) => (
              <div key={event.id} className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-foreground">{event.description}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {event.actor} · {event.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <MousePointer size={28} className="mx-auto text-text-muted mb-3" />
            <p className="text-sm text-text-secondary">No activity recorded yet</p>
            <p className="text-xs text-text-muted mt-1">
              Timeline events will appear as clients interact with the proposal.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
