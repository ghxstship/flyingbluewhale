export const metadata = { title: 'Press Portal' };

export default function PressPortalPage() {
  return (
    <div className="p-8">
      <h1 className="text-heading text-2xl text-text-primary mb-2">Press Portal</h1>
      <p className="text-text-secondary text-sm">Media workspace — credentials, media pool access, and press kits.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        <a href="credentials" className="p-4 rounded-lg border border-border bg-surface hover:bg-surface-hover transition-colors">
          <div className="text-lg mb-1">🪪</div>
          <h3 className="text-heading text-sm text-text-primary">Credentials</h3>
          <p className="text-xs text-text-tertiary mt-1">Press pass & zone access</p>
        </a>
        <a href="media-pool" className="p-4 rounded-lg border border-border bg-surface hover:bg-surface-hover transition-colors">
          <div className="text-lg mb-1">📷</div>
          <h3 className="text-heading text-sm text-text-primary">Media Pool</h3>
          <p className="text-xs text-text-tertiary mt-1">Photo pit assignments & schedule</p>
        </a>
        <a href="press-kits" className="p-4 rounded-lg border border-border bg-surface hover:bg-surface-hover transition-colors">
          <div className="text-lg mb-1">📰</div>
          <h3 className="text-heading text-sm text-text-primary">Press Kits</h3>
          <p className="text-xs text-text-tertiary mt-1">Downloadable assets & info</p>
        </a>
        <a href="schedule" className="p-4 rounded-lg border border-border bg-surface hover:bg-surface-hover transition-colors">
          <div className="text-lg mb-1">📅</div>
          <h3 className="text-heading text-sm text-text-primary">Schedule</h3>
          <p className="text-xs text-text-tertiary mt-1">Interview windows & set times</p>
        </a>
      </div>
    </div>
  );
}
