export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { ImportForm } from "./ImportForm";

/**
 * Import Centre — Opportunity #7 UI surface.
 * Three targets shipped: crew roster, vendors, project tasks.
 */

export default async function ImportsPage() {
  await requireSession();
  return (
    <>
      <ModuleHeader
        eyebrow="Settings"
        title="Import Centre"
        subtitle="Bulk-import CSV into crew, tasks, or vendors."
      />
      <div className="page-content space-y-6 max-w-4xl">
        <section className="surface p-5">
          <ImportForm />
        </section>
        <section className="surface p-5 text-sm text-[var(--text-muted)]">
          <h3 className="text-sm font-semibold mb-2 text-[var(--foreground)]">Column reference</h3>
          <p><strong>crew-members:</strong> name (required), role, phone, email, day_rate_cents, notes</p>
          <p><strong>tasks:</strong> title (required), description, status (todo|in_progress|review|blocked|done), priority (0-5), due_at (ISO)</p>
          <p><strong>vendors:</strong> name (required), contact_email, contact_phone, category, notes</p>
        </section>
      </div>
    </>
  );
}
