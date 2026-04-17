export const metadata = { title: 'COMPVSS — Field Operations' };

export default function MobileLandingPage() {
  return (
    <div className="p-6">
      <h1 className="text-heading text-xl text-text-primary mb-1">Welcome back</h1>
      <p className="text-text-secondary text-sm mb-6">Field operations dashboard</p>
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: '📱', label: 'Check In', href: '/m/check-in' },
          { icon: '✅', label: 'My Tasks', href: '/m/tasks' },
          { icon: '⏱️', label: 'Clock In', href: '/m/crew/clock' },
          { icon: '📦', label: 'Scan Item', href: '/m/inventory/scan' },
          { icon: '🚨', label: 'Incident', href: '/m/incidents/new' },
          { icon: '📋', label: 'Call Sheet', href: '/m/crew' },
        ].map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-surface hover:bg-surface-hover transition-colors gap-2"
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-xs text-text-primary font-medium">{item.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
