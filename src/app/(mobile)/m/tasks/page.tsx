export const metadata = { title: 'Tasks' };

export default function TasksPage() {
  return (
    <div className="p-8">
      <h1 className="text-heading text-2xl text-text-primary mb-2">Tasks</h1>
      <p className="text-text-secondary text-sm">Your assigned tasks (offline queue supported).</p>
    </div>
  );
}
