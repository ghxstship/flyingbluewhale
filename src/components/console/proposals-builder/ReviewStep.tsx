'use client';

import type { ProjectSetupData } from './ProjectSetupStep';
import type { VenueData } from './VenueStep';
import type { TeamAssignmentData } from './TeamStep';
import type { PhaseData } from './PhaseEditorStep';
import Button from '@/components/ui/Button';

interface ReviewStepProps {
  projectSetup: ProjectSetupData;
  venues: VenueData[];
  team: TeamAssignmentData[];
  phases: PhaseData[];
  onSendToClient: () => void;
  onSaveAsDraft: () => void;
}

// Reuse from TeamStep for display
const SEED_TEAM_MEMBERS: Record<string, string> = {
  'user-1': 'Sarah Chen',
  'user-2': 'Marcus Rivera',
  'user-3': 'James O\'Brien',
  'user-4': 'Priya Patel',
  'user-5': 'Alex Kim',
  'user-6': 'Dana Moretti',
};

const SEED_CLIENTS: Record<string, string> = {
  'client-1': 'Acme Corp',
  'client-2': 'Globex Industries',
  'client-3': 'Stark Events Group',
  'client-4': 'Wayne Enterprises',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2 mb-4">
      {children}
    </h3>
  );
}

export default function ReviewStep({
  projectSetup,
  venues,
  team,
  phases,
  onSendToClient,
  onSaveAsDraft,
}: ReviewStepProps) {
  // Calculate totals
  const phaseTotals = phases.map((phase) => {
    const deliverables = phase.deliverables.reduce((sum, d) => sum + d.totalCost, 0);
    const selectedAddons = phase.addons
      .filter((a) => a.selected)
      .reduce((sum, a) => sum + a.totalCost, 0);
    return { deliverables, selectedAddons, total: deliverables + selectedAddons };
  });

  const totalInvestment = phaseTotals.reduce((sum, p) => sum + p.deliverables, 0);
  const totalAddons = phaseTotals.reduce((sum, p) => sum + p.selectedAddons, 0);
  const grandTotal = totalInvestment + totalAddons;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Review Proposal</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Review all details before sending to the client.
        </p>
      </div>

      {/* Project Info */}
      <section>
        <SectionHeading>Project Information</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-text-muted">Client</p>
            <p className="text-sm font-medium text-foreground">
              {SEED_CLIENTS[projectSetup.clientId] || 'Not selected'}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Project Name</p>
            <p className="text-sm font-medium text-foreground">
              {projectSetup.projectName || 'Untitled'}
            </p>
          </div>
          {projectSetup.subtitle && (
            <div>
              <p className="text-xs text-text-muted">Subtitle</p>
              <p className="text-sm text-foreground">{projectSetup.subtitle}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-text-muted">Payment Terms</p>
            <p className="text-sm text-foreground">
              {projectSetup.depositPercent}% deposit / {projectSetup.balancePercent}% balance
            </p>
          </div>
        </div>
        {(projectSetup.brandVoice || projectSetup.audienceProfile || projectSetup.experienceGoal) && (
          <div className="mt-4 space-y-2">
            {projectSetup.brandVoice && (
              <div>
                <p className="text-xs text-text-muted">Brand Voice</p>
                <p className="text-sm text-text-secondary">{projectSetup.brandVoice}</p>
              </div>
            )}
            {projectSetup.audienceProfile && (
              <div>
                <p className="text-xs text-text-muted">Audience Profile</p>
                <p className="text-sm text-text-secondary">{projectSetup.audienceProfile}</p>
              </div>
            )}
            {projectSetup.experienceGoal && (
              <div>
                <p className="text-xs text-text-muted">Experience Goal</p>
                <p className="text-sm text-text-secondary">{projectSetup.experienceGoal}</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Venues */}
      {venues.length > 0 && (
        <section>
          <SectionHeading>Venues ({venues.length})</SectionHeading>
          <div className="space-y-3">
            {venues.map((venue, index) => (
              <div
                key={venue.id}
                className="rounded-lg border border-border px-4 py-3"
              >
                <p className="text-sm font-medium text-foreground">
                  {venue.name || `Venue ${index + 1}`}
                </p>
                <p className="text-xs text-text-secondary">
                  {[venue.address.street, venue.address.city, venue.address.state, venue.address.zip]
                    .filter(Boolean)
                    .join(', ') || 'No address'}
                </p>
                {venue.type && (
                  <span className="mt-1 inline-block rounded-full bg-bg-tertiary px-2 py-0.5 text-xs text-text-muted">
                    {venue.type}
                  </span>
                )}
                {venue.activationDates?.start && (
                  <p className="mt-1 text-xs text-text-muted">
                    {venue.activationDates.start} to {venue.activationDates.end}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Team */}
      {team.length > 0 && (
        <section>
          <SectionHeading>Team ({team.length})</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {team.map((assignment) => (
              <div key={assignment.id} className="flex items-center gap-3 rounded-lg border border-border px-4 py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{assignment.role || 'No role'}</p>
                  <p className="text-xs text-text-secondary">
                    {SEED_TEAM_MEMBERS[assignment.userId] || 'Unassigned'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Phases */}
      <section>
        <SectionHeading>Phases ({phases.length})</SectionHeading>
        <div className="space-y-4">
          {phases.map((phase, phaseIndex) => {
            const totals = phaseTotals[phaseIndex];
            return (
              <div key={phase.id} className="rounded-lg border border-border">
                {/* Phase header */}
                <div className="flex items-center justify-between px-4 py-3 bg-bg-secondary rounded-t-lg border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-org-primary text-[10px] font-bold text-white">
                      {phase.number}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{phase.name || 'Untitled Phase'}</p>
                      {phase.subtitle && (
                        <p className="text-xs text-text-secondary">{phase.subtitle}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{formatCurrency(totals.total)}</p>
                </div>

                <div className="px-4 py-3 space-y-3">
                  {/* Narrative excerpt */}
                  {phase.narrative && (
                    <p className="text-xs text-text-secondary line-clamp-2">{phase.narrative}</p>
                  )}

                  {/* Deliverables */}
                  {phase.deliverables.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-text-muted mb-1">
                        Deliverables ({phase.deliverables.length})
                      </p>
                      <ul className="space-y-0.5">
                        {phase.deliverables.map((d) => (
                          <li key={d.id} className="flex items-center justify-between text-xs">
                            <span className="text-text-secondary">
                              {d.name || 'Unnamed'} ({d.qty} {d.unit})
                            </span>
                            <span className="text-foreground font-medium">{formatCurrency(d.totalCost)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Add-ons */}
                  {phase.addons.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-addon mb-1">
                        Add-ons ({phase.addons.filter((a) => a.selected).length} selected of {phase.addons.length})
                      </p>
                      <ul className="space-y-0.5">
                        {phase.addons.map((a) => (
                          <li key={a.id} className="flex items-center justify-between text-xs">
                            <span className={a.selected ? 'text-text-secondary' : 'text-text-muted line-through'}>
                              {a.name || 'Unnamed'}
                              {a.mutuallyExclusiveGroup && ` [${a.mutuallyExclusiveGroup}]`}
                            </span>
                            <span className={a.selected ? 'text-addon font-medium' : 'text-text-muted'}>
                              {formatCurrency(a.totalCost)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Milestone */}
                  {phase.milestone.name && (
                    <div>
                      <p className="text-xs font-medium text-milestone mb-1">
                        Milestone: {phase.milestone.name}
                      </p>
                      {phase.milestone.requirements.length > 0 && (
                        <ul className="space-y-0.5">
                          {phase.milestone.requirements.map((req) => (
                            <li key={req.id} className="text-xs text-text-secondary flex items-center gap-1.5">
                              <span className="h-1 w-1 rounded-full bg-milestone shrink-0" />
                              {req.text}
                              <span className="text-text-muted">({req.assignee})</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Investment Summary */}
      <section>
        <SectionHeading>Investment Summary</SectionHeading>
        <div className="rounded-lg border border-border bg-bg-secondary px-5 py-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Base Investment</span>
            <span className="font-medium text-foreground">{formatCurrency(totalInvestment)}</span>
          </div>
          {totalAddons > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-addon">Selected Add-ons</span>
              <span className="font-medium text-addon">{formatCurrency(totalAddons)}</span>
            </div>
          )}
          <div className="border-t border-border pt-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Total Investment</span>
            <span className="text-xl font-bold text-foreground">{formatCurrency(grandTotal)}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Deposit ({projectSetup.depositPercent}%)</span>
            <span>{formatCurrency(grandTotal * (projectSetup.depositPercent / 100))}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Balance ({projectSetup.balancePercent}%)</span>
            <span>{formatCurrency(grandTotal * (projectSetup.balancePercent / 100))}</span>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          onClick={onSaveAsDraft}
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-text-secondary hover:bg-bg-secondary transition-colors"
        >
          Save as Draft
        </Button>
        <Button
          type="button"
          onClick={onSendToClient}
          className="rounded-lg bg-org-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-org-primary/90 transition-colors"
        >
          Send to Client
        </Button>
      </div>
    </div>
  );
}
