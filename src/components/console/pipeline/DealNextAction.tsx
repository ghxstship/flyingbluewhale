'use client';

import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';

interface DealNextActionProps {
  stage: string;
  daysSinceUpdate: number;
  daysInPipeline: number;
  probability: number;
  activityCount: number;
  hasContacts: boolean;
  wonDate: string | null;
}

interface NextAction {
  icon: string; // Short text prefix
  label: string;
  priority: 'high' | 'medium' | 'low';
}

function computeNextActions(props: DealNextActionProps): NextAction[] {
  if (props.wonDate) return [];

  const actions: NextAction[] = [];

  // Stage-specific prompts
  switch (props.stage) {
    case 'lead':
      actions.push({
        icon: 'Call',
        label: 'Qualify this lead — schedule a discovery call',
        priority: 'high',
      });
      if (!props.hasContacts) {
        actions.push({
          icon: 'Contact',
          label: 'Identify the decision-maker',
          priority: 'medium',
        });
      }
      break;
    case 'qualified':
      actions.push({
        icon: 'Proposal',
        label: 'Prepare and send a proposal',
        priority: 'high',
      });
      break;
    case 'proposal_sent':
      if (props.daysSinceUpdate > 3) {
        actions.push({
          icon: 'Follow-up',
          label: 'Follow up on the proposal',
          priority: 'high',
        });
      } else {
        actions.push({
          icon: 'Wait',
          label: 'Wait for client response, prepare for negotiation',
          priority: 'low',
        });
      }
      break;
    case 'negotiation':
      actions.push({
        icon: 'Negotiate',
        label: 'Address objections and finalize terms',
        priority: 'high',
      });
      if (props.probability < 50) {
        actions.push({
          icon: 'Strategy',
          label: 'Consider offering a concession or revised scope',
          priority: 'medium',
        });
      }
      break;
    case 'verbal_yes':
      actions.push({
        icon: 'Contract',
        label: 'Send the contract for signature',
        priority: 'high',
      });
      break;
  }

  // Activity-based suggestions
  if (props.daysSinceUpdate > 14 && props.stage !== 'verbal_yes') {
    actions.unshift({
      icon: 'Urgent',
      label: 'Re-engage — this deal is going cold',
      priority: 'high',
    });
  }

  if (props.activityCount < 2 && props.daysInPipeline > 7) {
    actions.push({
      icon: 'Log',
      label: 'Log activities to build an engagement trail',
      priority: 'medium',
    });
  }

  return actions.slice(0, 3); // Max 3 recommendations
}

const PRIORITY_STYLES: Record<string, string> = {
  high: 'border-l-amber-500 bg-amber-50/50',
  medium: 'border-l-blue-400 bg-blue-50/30',
  low: 'border-l-gray-300 bg-bg-secondary/30',
};

export default function DealNextAction(props: DealNextActionProps) {
  const actions = useMemo(() => computeNextActions(props), [props]);

  if (actions.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <TrendingUp size={14} />
        Next Best Actions
      </h3>
      <ul className="space-y-2">
        {actions.map((action, idx) => (
          <li
            key={idx}
            className={`rounded-lg border-l-2 px-3 py-2.5 text-xs text-text-secondary ${PRIORITY_STYLES[action.priority]}`}
          >
            <span className="mr-1.5 font-semibold text-text-muted">{action.icon}:</span>
            {action.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
