export const metadata = { title: 'Management Portal' };

export default function ManagementPortalPage() {
  return (
    <div className="p-8">
      <h1 className="text-heading text-2xl text-text-primary mb-2">Management Portal</h1>
      <p className="text-text-secondary text-sm">Department management — rosters, timesheets, budgets, and approvals.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        <a href="roster" className="p-4 rounded-lg border border-border bg-surface hover:bg-surface-hover transition-colors">
          <div className="text-lg mb-1">👥</div>
          <h3 className="text-heading text-sm text-text-primary">Roster</h3>
          <p className="text-xs text-text-tertiary mt-1">Crew & staff assignments</p>
        </a>
        <a href="shifts" className="p-4 rounded-lg border border-border bg-surface hover:bg-surface-hover transition-colors">
          <div className="text-lg mb-1">📋</div>
          <h3 className="text-heading text-sm text-text-primary">Shifts</h3>
          <p className="text-xs text-text-tertiary mt-1">Schedule & assign shifts</p>
        </a>
        <a href="timesheets" className="p-4 rounded-lg border border-border bg-surface hover:bg-surface-hover transition-colors">
          <div className="text-lg mb-1">⏱️</div>
          <h3 className="text-heading text-sm text-text-primary">Timesheets</h3>
          <p className="text-xs text-text-tertiary mt-1">Review & approve timesheets</p>
        </a>
        <a href="deliverables" className="p-4 rounded-lg border border-border bg-surface hover:bg-surface-hover transition-colors">
          <div className="text-lg mb-1">📦</div>
          <h3 className="text-heading text-sm text-text-primary">Deliverables</h3>
          <p className="text-xs text-text-tertiary mt-1">Submit & track deliverables</p>
        </a>
        <a href="credentials" className="p-4 rounded-lg border border-border bg-surface hover:bg-surface-hover transition-colors">
          <div className="text-lg mb-1">🪪</div>
          <h3 className="text-heading text-sm text-text-primary">Credentials</h3>
          <p className="text-xs text-text-tertiary mt-1">Badge requests & access zones</p>
        </a>
        <a href="incidents" className="p-4 rounded-lg border border-border bg-surface hover:bg-surface-hover transition-colors">
          <div className="text-lg mb-1">⚠️</div>
          <h3 className="text-heading text-sm text-text-primary">Incidents</h3>
          <p className="text-xs text-text-tertiary mt-1">Report & escalate issues</p>
        </a>
      </div>
    </div>
  );
}
