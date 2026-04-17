const CHANNELS = ["Email", "In-app", "Slack", "Push"];
const EVENTS = [
  "invoice.sent", "invoice.paid", "proposal.signed",
  "deliverable.submitted", "task.assigned", "ticket.scanned", "advance.approved",
];

export default function NotificationsPrefs() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">Choose how you get updates for each workspace event.</p>
      <div className="surface mt-6 overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Event</th>
              {CHANNELS.map((c) => <th key={c}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {EVENTS.map((e) => (
              <tr key={e}>
                <td className="font-mono text-xs">{e}</td>
                {CHANNELS.map((c) => (
                  <td key={c} className="text-center">
                    <input type="checkbox" defaultChecked={c === "Email" || c === "In-app"} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
