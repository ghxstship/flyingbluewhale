'use client';

import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';

interface DealRiskAssessmentProps {
  dealValue: number;
  probability: number;
  stage: string;
  createdAt: string;
  updatedAt: string;
  wonDate: string | null;
  expectedCloseDate: string | null;
  activityCount: number;
}

interface RiskSignal {
  label: string;
  severity: 'high' | 'medium' | 'low';
}

interface RiskResult {
  level: 'high' | 'medium' | 'low';
  score: number;
  signals: RiskSignal[];
  recommendation: string;
}

function assessDealRisk(props: DealRiskAssessmentProps): RiskResult {
  const signals: RiskSignal[] = [];
  let riskScore = 0;

  // Already won — no risk
  if (props.wonDate) {
    return { level: 'low', score: 0, signals: [], recommendation: 'This deal is already closed-won.' };
  }

  const now = Date.now();
  const createdMs = new Date(props.createdAt).getTime();
  const updatedMs = new Date(props.updatedAt).getTime();

  // 1. Stagnation risk
  const daysSinceUpdate = Math.floor((now - updatedMs) / (1000 * 60 * 60 * 24));
  if (daysSinceUpdate >= 21) {
    riskScore += 30;
    signals.push({ label: `No activity for ${daysSinceUpdate} days`, severity: 'high' });
  } else if (daysSinceUpdate >= 10) {
    riskScore += 15;
    signals.push({ label: `Last activity ${daysSinceUpdate} days ago`, severity: 'medium' });
  }

  // 2. Aging risk
  const daysInPipeline = Math.floor((now - createdMs) / (1000 * 60 * 60 * 24));
  if (daysInPipeline > 90) {
    riskScore += 25;
    signals.push({ label: `${daysInPipeline} days in pipeline (>90d)`, severity: 'high' });
  } else if (daysInPipeline > 45) {
    riskScore += 10;
    signals.push({ label: `${daysInPipeline} days in pipeline`, severity: 'medium' });
  }

  // 3. Overdue close date
  if (props.expectedCloseDate) {
    const closeMs = new Date(props.expectedCloseDate).getTime();
    if (closeMs < now) {
      const daysOverdue = Math.floor((now - closeMs) / (1000 * 60 * 60 * 24));
      riskScore += 20;
      signals.push({ label: `Expected close date passed (${daysOverdue}d ago)`, severity: 'high' });
    }
  } else {
    riskScore += 5;
    signals.push({ label: 'No expected close date set', severity: 'low' });
  }

  // 4. Low probability
  if (props.probability < 20) {
    riskScore += 15;
    signals.push({ label: `Low probability (${props.probability}%)`, severity: 'medium' });
  }

  // 5. Low activity
  if (props.activityCount === 0) {
    riskScore += 15;
    signals.push({ label: 'No recorded activities', severity: 'medium' });
  } else if (props.activityCount < 3) {
    riskScore += 5;
    signals.push({ label: `Only ${props.activityCount} activities logged`, severity: 'low' });
  }

  // 6. Early stage + high value
  const earlyStages = ['lead', 'qualified'];
  if (earlyStages.includes(props.stage) && props.dealValue >= 25000) {
    riskScore += 10;
    signals.push({ label: 'High-value deal still in early stage', severity: 'medium' });
  }

  // Clamp
  riskScore = Math.min(100, riskScore);

  const level: RiskResult['level'] =
    riskScore >= 40 ? 'high' : riskScore >= 20 ? 'medium' : 'low';

  // Generate recommendation
  let recommendation = '';
  if (level === 'high') {
    if (daysSinceUpdate >= 14) {
      recommendation = 'Schedule a check-in call or email to re-engage this contact.';
    } else if (daysInPipeline > 90) {
      recommendation = 'Consider re-qualifying or adjusting the close date.';
    } else {
      recommendation = 'This deal needs immediate attention. Review with team.';
    }
  } else if (level === 'medium') {
    recommendation = 'Monitor closely and plan next touchpoint within the week.';
  } else {
    recommendation = 'On track. Continue following the standard sales cadence.';
  }

  return { level, score: riskScore, signals, recommendation };
}

const LEVEL_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  high: { bg: 'bg-red-500/10', text: 'text-red-700', border: 'border-red-500/30', label: 'High Risk' },
  medium: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Medium Risk' },
  low: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'Low Risk' },
};

export default function DealRiskAssessment(props: DealRiskAssessmentProps) {
  const risk = useMemo(() => assessDealRisk(props), [props]);

  if (risk.signals.length === 0) return null;

  const style = LEVEL_STYLES[risk.level];

  return (
    <div className={`rounded-xl border ${style.border} ${style.bg} p-5`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <AlertTriangle size={14} />
          AI Risk Assessment
        </h3>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${style.text} ${style.bg}`}>
          {style.label}
        </span>
      </div>

      {/* Risk score bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-text-muted mb-1">
          <span>Risk Score</span>
          <span className="tabular-nums font-medium">{risk.score}/100</span>
        </div>
        <div className="h-1.5 rounded-full bg-background overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              risk.level === 'high' ? 'bg-red-500' : risk.level === 'medium' ? 'bg-amber-500' : 'bg-green-500'
            }`}
            style={{ width: `${risk.score}%` }}
          />
        </div>
      </div>

      {/* Signals */}
      <ul className="space-y-1 mb-3">
        {risk.signals.map((signal) => (
          <li key={signal.label} className="flex items-center gap-2 text-xs">
            <span
              className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                signal.severity === 'high'
                  ? 'bg-red-500'
                  : signal.severity === 'medium'
                    ? 'bg-amber-500'
                    : 'bg-text-muted'
              }`}
            />
            <span className="text-text-secondary">{signal.label}</span>
          </li>
        ))}
      </ul>

      {/* Recommendation */}
      <div className="pt-2 border-t border-border/30">
        <p className="text-xs text-text-secondary">
          <span className="font-medium text-foreground">Suggested action:</span>{' '}
          {risk.recommendation}
        </p>
      </div>
    </div>
  );
}
