export const metadata = { title: 'Attendee Portal' };

export default function AttendeePortalPage() {
  return (
    <div className="p-8">
      <h1 className="text-heading text-2xl text-text-primary mb-2">Attendee Portal</h1>
      <p className="text-text-secondary text-sm">Your event experience — tickets, schedule, and event information.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        <a href="tickets" className="p-4 rounded-lg border border-border bg-surface hover:bg-surface-hover transition-colors">
          <div className="text-lg mb-1">🎟️</div>
          <h3 className="text-heading text-sm text-text-primary">My Tickets</h3>
          <p className="text-xs text-text-tertiary mt-1">View & manage your tickets</p>
        </a>
        <a href="schedule" className="p-4 rounded-lg border border-border bg-surface hover:bg-surface-hover transition-colors">
          <div className="text-lg mb-1">📅</div>
          <h3 className="text-heading text-sm text-text-primary">Schedule</h3>
          <p className="text-xs text-text-tertiary mt-1">Event lineup & set times</p>
        </a>
        <a href="venue" className="p-4 rounded-lg border border-border bg-surface hover:bg-surface-hover transition-colors">
          <div className="text-lg mb-1">📍</div>
          <h3 className="text-heading text-sm text-text-primary">Venue Info</h3>
          <p className="text-xs text-text-tertiary mt-1">Map, directions, & guidelines</p>
        </a>
      </div>
    </div>
  );
}
