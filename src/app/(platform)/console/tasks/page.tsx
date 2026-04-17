import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata = {
  title: 'Tasks & Approvals | GVTEWAY Console',
};

export default async function TasksDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch pending deliverables across active projects
  const { data: deliverables, error: devError } = await supabase
    .from('deliverables')
    .select('*, projects(name, slug)')
    .in('status', ['submitted', 'in_review'])
    .order('submitted_at', { ascending: false });

  // Fetch pending hierarchy tasks globally
  const { data: tasks, error: taskError } = await supabase
    .from('hierarchy_tasks')
    .select('*, projects(name, slug)')
    .eq('status', 'pending')
    .order('due_date', { ascending: true });

  if (devError || taskError) {
    console.error(devError || taskError);
  }

  return (
    <div className="flex flex-col gap-8 p-6 max-w-7xl mx-auto">
      <header>
        <h1 className="text-3xl font-display font-medium text-[var(--color-text-primary)]">Needs Review</h1>
        <p className="text-[var(--color-text-secondary)] mt-2">Aggregated dashboard of all pending deliverables and production gates.</p>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deliverables Panel */}
        <div className="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border)] p-5">
          <h2 className="text-xl font-medium mb-4 flex items-center justify-between">
            Pending Vendor/Talent Submissions
            <span className="bg-cyan-500/20 text-cyan-400 text-xs px-2 py-1 rounded-full">{deliverables?.length || 0}</span>
          </h2>
          <ul className="space-y-3">
            {deliverables?.map(d => (
              <li key={d.id} className="p-3 bg-[var(--color-bg-elevated)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{d.title}</p>
                    <p className="text-sm text-[var(--color-text-tertiary)]">{d.projects?.name} • {d.type.replace('_', ' ')}</p>
                  </div>
                  <Link href={`/console/${d.projects?.slug}/deliverables/${d.id}`} className="text-sm text-cyan-400 hover:text-cyan-300">
                    Review &rarr;
                  </Link>
                </div>
              </li>
            ))}
            {(!deliverables || deliverables.length === 0) && (
              <p className="text-sm text-[var(--color-text-tertiary)] italic">No pending submissions.</p>
            )}
          </ul>
        </div>

        {/* Hierarchy Tasks Panel */}
        <div className="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border)] p-5">
          <h2 className="text-xl font-medium mb-4 flex items-center justify-between">
            Open Production Gates
            <span className="bg-pink-500/20 text-pink-400 text-xs px-2 py-1 rounded-full">{tasks?.length || 0}</span>
          </h2>
          <ul className="space-y-3">
            {tasks?.map(t => (
              <li key={t.id} className="p-3 bg-[var(--color-bg-elevated)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{t.title}</p>
                    <p className="text-sm text-[var(--color-text-tertiary)]">{t.projects?.name} • Priority: {t.priority}</p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded text-[var(--color-text-secondary)]">
                    {t.is_gate ? 'Blocking' : 'Standard'}
                  </span>
                </div>
              </li>
            ))}
            {(!tasks || tasks.length === 0) && (
              <p className="text-sm text-[var(--color-text-tertiary)] italic">All gates cleared.</p>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
