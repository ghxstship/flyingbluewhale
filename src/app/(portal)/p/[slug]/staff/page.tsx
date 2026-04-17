export const metadata = { title: 'Staff Portal' };

export default function StaffPortalPage() {
  return (
    <div className="p-8">
      <h1 className="text-heading text-2xl text-text-primary mb-2">Staff Portal</h1>
      <p className="text-text-secondary text-sm">Event-day operations — check-in scanning, lost & found, and incident reporting.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        <a href="credentials" className="p-4 rounded-lg border border-border bg-surface hover:bg-surface-hover transition-colors">
          <div className="text-lg mb-1">🪪</div>
          <h3 className="text-heading text-sm text-text-primary">Credentials</h3>
          <p className="text-xs text-text-tertiary mt-1">Your badge & access zones</p>
        </a>
        <a href="shifts" className="p-4 rounded-lg border border-border bg-surface hover:bg-surface-hover transition-colors">
          <div className="text-lg mb-1">📋</div>
          <h3 className="text-heading text-sm text-text-primary">My Shifts</h3>
          <p className="text-xs text-text-tertiary mt-1">Assigned shifts & check-in/out</p>
        </a>
        <a href="incidents" className="p-4 rounded-lg border border-border bg-surface hover:bg-surface-hover transition-colors">
          <div className="text-lg mb-1">⚠️</div>
          <h3 className="text-heading text-sm text-text-primary">Incidents</h3>
          <p className="text-xs text-text-tertiary mt-1">Report & track incidents</p>
        </a>
      </div>
    </div>
  );
}
