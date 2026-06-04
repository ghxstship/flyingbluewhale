import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { DeleteForm } from "@/components/DeleteForm";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { createPunchList, deletePunchList, toggleListStatus } from "./actions";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  name: string;
  category: string | null;
  status: "open" | "closed";
  created_at: string;
  project_name: string | null;
  item_count: number;
  open_count: number;
};

const STATUS_TONE: Record<string, "muted" | "info" | "success"> = {
  open: "info",
  closed: "muted",
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.punch.lists.eyebrow", undefined, "Operations · Punch")}
          title={t("console.punch.lists.title", undefined, "Punch Lists")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.punch.lists.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  // Two-step: fetch lists + projects + item rollups, stitch labels client-side.
  // punch_items.punch_list_id has been on the schema since 0001 but no
  // surface ever read or wrote it — operators had no way to group items
  // into named lists. This page is the missing CRUD.
  const [{ data: listsData }, { data: projects }] = await Promise.all([
    supabase
      .from("punch_lists")
      .select("id, name, category, status, created_at, project_id")
      .eq("org_id", session.orgId)
      .order("created_at", { ascending: false }),
    supabase
      .from("projects")
      .select("id, name")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("name", { ascending: true })
      .limit(500),
  ]);

  type ListRow = {
    id: string;
    name: string;
    category: string | null;
    status: "open" | "closed";
    created_at: string;
    project_id: string | null;
  };
  const lists = (listsData ?? []) as ListRow[];
  const listIds = lists.map((l) => l.id);

  const { data: itemCounts } = listIds.length
    ? await supabase
        .from("punch_items")
        .select("punch_list_id, status")
        .in("punch_list_id", listIds)
        .eq("org_id", session.orgId)
    : { data: [] as Array<{ punch_list_id: string; status: string }> };

  type CountRow = { punch_list_id: string; status: string };
  const totals = new Map<string, { total: number; open: number }>();
  for (const r of (itemCounts ?? []) as CountRow[]) {
    const tally = totals.get(r.punch_list_id) ?? { total: 0, open: 0 };
    tally.total += 1;
    if (r.status !== "complete" && r.status !== "void") tally.open += 1;
    totals.set(r.punch_list_id, tally);
  }

  const projectById = new Map<string, string>();
  for (const p of (projects ?? []) as Array<{ id: string; name: string }>) projectById.set(p.id, p.name);

  const hydrated: Row[] = lists.map((l) => {
    const tally = totals.get(l.id) ?? { total: 0, open: 0 };
    return {
      id: l.id,
      name: l.name,
      category: l.category,
      status: l.status,
      created_at: l.created_at,
      // project_id is NOT NULL on punch_lists; project_name is only
      // null when the FK target was deleted (CASCADE means usually
      // the list went too, so this is a transient race).
      project_name: projectById.get(l.project_id ?? "") ?? null,
      item_count: tally.total,
      open_count: tally.open,
    };
  });

  const openLists = hydrated.filter((l) => l.status === "open").length;
  const openItems = hydrated.reduce((s, l) => s + l.open_count, 0);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.punch.lists.eyebrow", undefined, "Operations · Punch")}
        title={t("console.punch.lists.title", undefined, "Punch Lists")}
        subtitle={t(
          "console.punch.lists.subtitle",
          {
            listCount: hydrated.length,
            listLabel: hydrated.length === 1 ? "" : "s",
            openLists,
            openItems,
            itemLabel: openItems === 1 ? "" : "s",
          },
          `${hydrated.length} list${hydrated.length === 1 ? "" : "s"} · ${openLists} open · ${openItems} open item${openItems === 1 ? "" : "s"} across all lists`,
        )}
        breadcrumbs={[
          { label: t("console.punch.breadcrumb", undefined, "Punch"), href: "/console/punch" },
          { label: t("console.punch.lists.breadcrumb", undefined, "Lists") },
        ]}
        action={
          <Button href="/console/punch" size="sm" variant="ghost">
            {t("console.punch.lists.allItems", undefined, "← All Items")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <DataTable<Row>
          rows={hydrated}
          emptyLabel={t("console.punch.lists.emptyLabel", undefined, "No punch lists")}
          emptyDescription={t(
            "console.punch.lists.emptyDescription",
            undefined,
            "Create a list below to group items by milestone, area, or trade — easier to track 'all items for load-out' or 'closeout punch' than scrolling a flat 200-row list.",
          )}
          columns={[
            {
              key: "name",
              header: t("console.punch.lists.col.name", undefined, "Name"),
              render: (r) => (
                <Link href={`/console/punch?list=${r.id}`} className="font-semibold hover:underline">
                  {r.name}
                </Link>
              ),
              accessor: (r) => r.name,
              sortable: true,
            },
            {
              key: "project",
              header: t("console.punch.lists.col.project", undefined, "Project"),
              render: (r) => r.project_name ?? <span className="text-[var(--text-muted)]">—</span>,
              accessor: (r) => r.project_name ?? "",
              filterable: true,
              groupable: true,
            },
            {
              key: "category",
              header: t("console.punch.lists.col.category", undefined, "Category"),
              render: (r) =>
                r.category ? (
                  <Badge variant="muted">{r.category}</Badge>
                ) : (
                  <span className="text-[var(--text-muted)]">—</span>
                ),
              accessor: (r) => r.category ?? "",
              filterable: true,
              groupable: true,
            },
            {
              key: "items",
              header: t("console.punch.lists.col.items", undefined, "Items"),
              render: (r) => (
                <span className="font-mono text-xs">
                  {r.open_count}/{r.item_count}{" "}
                  <span className="text-[var(--text-muted)]">
                    {t("console.punch.lists.openSuffix", undefined, "open")}
                  </span>
                </span>
              ),
              accessor: (r) => r.open_count,
            },
            {
              key: "status",
              header: t("console.punch.lists.col.status", undefined, "Status"),
              render: (r) => (
                <form action={toggleListStatus}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="status" value={r.status === "open" ? "closed" : "open"} />
                  <Button type="submit" variant="ghost" size="sm">
                    <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{toTitle(r.status)}</Badge>
                  </Button>
                </form>
              ),
              accessor: (r) => r.status,
              filterable: true,
            },
            {
              key: "created_at",
              header: t("console.punch.lists.col.created", undefined, "Created"),
              render: (r) => <span className="font-mono text-xs">{fmt.date(r.created_at)}</span>,
              accessor: (r) => r.created_at,
              sortable: true,
            },
            {
              key: "actions",
              header: "",
              render: (r) => (
                <DeleteForm
                  action={deletePunchList.bind(null, r.id)}
                  confirm={
                    r.item_count > 0
                      ? t(
                          "console.punch.lists.deleteConfirmWithItems",
                          {
                            name: r.name,
                            count: r.item_count,
                            itemLabel: r.item_count === 1 ? "" : "s",
                          },
                          `Delete "${r.name}"? ${r.item_count} item${r.item_count === 1 ? "" : "s"} will be unassigned (the items themselves stay).`,
                        )
                      : t("console.punch.lists.deleteConfirm", { name: r.name }, `Delete "${r.name}"?`)
                  }
                />
              ),
            },
          ]}
        />

        <section className="surface p-5">
          <h2 className="text-sm font-semibold">{t("console.punch.lists.createHeading", undefined, "Create List")}</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {t(
              "console.punch.lists.createHelp",
              undefined,
              "Lists let you group items by milestone (Pre-Show / Show-Ready / Closeout), area (Stage A / Stage B), or trade (Electrical / Rigging). Items keep their existing fields — the list is just a grouping.",
            )}
          </p>
          <form
            action={createPunchList}
            className="surface-inset mt-3 grid grid-cols-1 gap-2 rounded-md p-3 sm:grid-cols-6"
          >
            <input
              name="name"
              required
              maxLength={160}
              placeholder={t("console.punch.lists.namePlaceholder", undefined, "MMW Day 1 Punch")}
              className="input-base sm:col-span-2"
            />
            <select name="project_id" required defaultValue="" className="input-base sm:col-span-2">
              <option value="" disabled>
                {t("console.punch.lists.projectPlaceholder", undefined, "— Project —")}
              </option>
              {((projects ?? []) as Array<{ id: string; name: string }>).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <input
              name="category"
              maxLength={80}
              placeholder={t("console.punch.lists.categoryPlaceholder", undefined, "Category (optional)")}
              className="input-base sm:col-span-1"
            />
            <Button type="submit" size="sm" variant="secondary" className="sm:col-span-1">
              {t("console.punch.lists.createButton", undefined, "Create List")}
            </Button>
          </form>
        </section>
      </div>
    </>
  );
}
