import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string | null;
  active: boolean;
  created_at: string;
  items: { count: number }[] | null;
};

const CATEGORY_LABEL: Record<string, string> = {
  rigging: "Rigging",
  fire: "Fire",
  electrical: "Electrical",
  ada: "ADA",
  food_safety: "Food Safety",
  security: "Security",
  foh: "FOH",
  medical: "Medical",
  sustainability: "Sustainability",
  custom: "Custom",
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Safety" title="Inspection Templates" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("inspection_templates")
    .select("id, code, name, category, description, active, created_at, items:inspection_template_items(count)")
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <ModuleHeader
        eyebrow="Safety"
        title="Inspection Templates"
        subtitle={`${rows.length} template${rows.length === 1 ? "" : "s"}`}
        breadcrumbs={[{ label: "Inspections", href: "/console/inspections" }, { label: "Templates" }]}
        action={
          <Button href="/console/inspections/templates/new" size="sm">
            + New Template
          </Button>
        }
      />
      <div className="page-content space-y-4">
        {rows.length === 0 ? (
          <div className="surface">
            <EmptyState
              size="compact"
              title="No templates yet"
              description="Templates define reusable checklists. Create one to schedule inspections from it."
              action={
                <Button href="/console/inspections/templates/new" size="sm">
                  + Create first template
                </Button>
              }
            />
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((t) => {
              const itemCount = t.items?.[0]?.count ?? 0;
              return (
                <li key={t.id} className="surface hover-lift p-4">
                  <Link href={`/console/inspections/templates`} className="block">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-mono text-[11px] tracking-wider text-[var(--text-muted)] uppercase">
                          {t.code}
                        </div>
                        <div className="mt-1 truncate text-sm font-semibold">{t.name}</div>
                      </div>
                      {!t.active && <Badge variant="muted">Inactive</Badge>}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-[11px]">
                      <Badge variant="info">{CATEGORY_LABEL[t.category] ?? t.category}</Badge>
                      <span className="text-[var(--text-muted)]">
                        {itemCount} item{itemCount === 1 ? "" : "s"}
                      </span>
                    </div>
                    {t.description && (
                      <p className="mt-2 line-clamp-2 text-xs text-[var(--text-secondary)]">{t.description}</p>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
