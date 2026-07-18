"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  ActionBar,
  EmptySkeleton,
  GroupedList,
  KIcon,
  RecordDetail,
  SwipeRow,
  UndoBar,
  useUndo,
} from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/hooks/useToast";
import {
  archiveFieldTemplate,
  duplicateFieldTemplate,
  promoteFieldTemplate,
  restoreFieldTemplate,
  applyFieldTemplate,
} from "./actions";

/**
 * COMPVSS · Templates list (kit 31 `tab === "templates"`). Scope seg
 * (All / Org Library / This Project), ActionBar (search · group · sort),
 * SwipeRow actions Use / Copy / Archive with the 5s UndoBar on archive,
 * and a RecordDetail sheet per row with Use / Promote / Duplicate / Archive.
 */

export type TemplateItem = {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  icon: string;
  scope: "org" | "project";
  projectName: string | null;
  summary: string | null;
  uses: number;
  updated: string;
  updatedAt: string;
};

const CATEGORY_ORDER = ["roster", "advance", "checklist", "contract", "task_list", "schedule", "onboarding", "budget"];

export function TemplatesList({ items, canManage }: { items: TemplateItem[]; canManage: boolean }) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();

  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<"all" | "org" | "project">("all");
  const [group, setGroup] = useState("none");
  const [sort, setSort] = useState("recent");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [gone, setGone] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const { undo, withUndo, clearUndo } = useUndo();

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = items.filter(
      (i) =>
        !gone.has(i.id) &&
        (scope === "all" || i.scope === scope) &&
        (!q || `${i.name} ${i.categoryLabel}`.toLowerCase().includes(q)),
    );
    if (sort === "name") return filtered.slice().sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "uses") return filtered.slice().sort((a, b) => b.uses - a.uses);
    return filtered.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [items, gone, scope, query, sort]);

  const orgLibLabel = t("m.templates.orgLibrary", undefined, "Organization Library");
  const projLibLabel = t("m.templates.projectLibrary", undefined, "Project Library");

  const groups = useMemo(() => {
    if (group === "cat") {
      const mp = new Map<string, TemplateItem[]>();
      for (const i of visible) {
        const arr = mp.get(i.category) ?? [];
        arr.push(i);
        mp.set(i.category, arr);
      }
      return CATEGORY_ORDER.filter((c) => mp.has(c)).map((c) => {
        const arr = mp.get(c)!;
        return [arr[0]?.categoryLabel ?? c, arr] as [string, TemplateItem[]];
      });
    }
    if (group === "scope") {
      const org = visible.filter((i) => i.scope === "org");
      const proj = visible.filter((i) => i.scope === "project");
      const out: Array<[string, TemplateItem[]]> = [];
      if (org.length) out.push([orgLibLabel, org]);
      if (proj.length) out.push([projLibLabel, proj]);
      return out;
    }
    return null;
  }, [visible, group, orgLibLabel, projLibLabel]);

  const run = (fn: () => Promise<{ error?: string } | { error?: string; uses?: number }>, okMsg: string) =>
    startTransition(async () => {
      const res = await fn();
      if (res?.error) toast.error(res.error);
      else {
        toast.success(okMsg);
        router.refresh();
      }
    });

  const onUse = (i: TemplateItem) =>
    run(() => applyFieldTemplate(i.id), t("m.templates.used", { name: i.name }, `Template Applied · ${i.name}`));
  const onCopy = (i: TemplateItem) =>
    run(() => duplicateFieldTemplate(i.id), t("m.templates.copied", { name: i.name }, `Duplicated · ${i.name}`));
  const onPromote = (i: TemplateItem) =>
    run(() => promoteFieldTemplate(i.id), t("m.templates.promoted", { name: i.name }, `Promoted To Org · ${i.name}`));
  const onArchive = (i: TemplateItem) => {
    setGone((s) => new Set(s).add(i.id));
    startTransition(async () => {
      const res = await archiveFieldTemplate(i.id);
      if (res?.error) {
        setGone((s) => {
          const n = new Set(s);
          n.delete(i.id);
          return n;
        });
        toast.error(res.error);
        return;
      }
      withUndo(t("m.templates.archived", { name: i.name }, `Archived · ${i.name}`), () => {
        setGone((s) => {
          const n = new Set(s);
          n.delete(i.id);
          return n;
        });
        void restoreFieldTemplate(i.id).then(() => router.refresh());
      });
      router.refresh();
    });
  };

  const row = (i: TemplateItem) => (
    <SwipeRow
      key={i.id}
      onClick={() => setOpenId(i.id)}
      actions={[
        { icon: "Play", label: t("m.templates.use", undefined, "Use"), tone: "ok", on: () => onUse(i) },
        ...(canManage
          ? [
              { icon: "Copy", label: t("m.templates.copy", undefined, "Copy"), tone: "info" as const, on: () => onCopy(i) },
              {
                icon: "Archive",
                label: t("m.templates.archive", undefined, "Archive"),
                tone: "neutral" as const,
                on: () => onArchive(i),
              },
            ]
          : []),
      ]}
    >
      <div className="item tap" style={{ margin: 0, cursor: "pointer" }}>
        <span className="form-ic">
          <KIcon name={i.icon} size={18} />
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="t">{i.name}</div>
          <div className="s">
            {i.summary ? `${i.summary} · ` : ""}
            {t("m.templates.usedTimes", { count: i.uses }, `Used ${i.uses}×`)}
          </div>
        </div>
        <span className={`ps-badge ${i.scope === "org" ? "ps-badge--info" : "ps-badge--neutral"}`}>
          {i.scope === "org" ? t("m.templates.scopeOrg", undefined, "Org") : t("m.templates.scopeProject", undefined, "Project")}
        </span>
      </div>
    </SwipeRow>
  );

  const open = openId ? (items.find((i) => i.id === openId) ?? null) : null;

  return (
    <div className="screen screen-anim">
      <Link href="/m/more" className="backbtn">
        <KIcon name="ChevronLeft" size={17} /> {t("m.templates.back", undefined, "More")}
      </Link>
      <div className="scr-eye">{t("m.templates.eyebrow", undefined, "Library")}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <h1 className="scr-h" style={{ marginBottom: 0, flex: 1 }}>
          {t("m.templates.title", undefined, "Templates")}
        </h1>
        {canManage && (
          <Link href="/m/templates/new" className="ps-btn ps-btn--cta ps-btn--sm" style={{ textDecoration: "none" }}>
            <KIcon name="Plus" size={15} /> {t("m.templates.new", undefined, "New Template")}
          </Link>
        )}
      </div>

      <div className="import-note" style={{ marginBottom: 12 }}>
        <KIcon name="Recycle" size={14} style={{ color: "var(--p-accent-text)" }} />
        <span>
          {t(
            "m.templates.intro",
            undefined,
            "One library for everything repeatable: rosters, advances, checklists, contracts, schedules. Org templates apply to every project; project templates can be promoted.",
          )}
        </span>
      </div>

      <div className="seg2" style={{ marginBottom: 10 }}>
        {(
          [
            ["all", t("m.templates.scopeAll", undefined, "All")],
            ["org", t("m.templates.scopeOrgLib", undefined, "Org Library")],
            ["project", t("m.templates.scopeThisProject", undefined, "This Project")],
          ] as Array<["all" | "org" | "project", string]>
        ).map(([id, label]) => (
          <button key={id} type="button" className={scope === id ? "on" : ""} onClick={() => setScope(id)}>
            {label}
          </button>
        ))}
      </div>

      <ActionBar
        k="tp"
        query={query}
        setQuery={setQuery}
        placeholder={t("m.templates.search", undefined, "Search templates…")}
        group={group}
        setGroup={setGroup}
        groupOpts={[
          ["none", t("m.templates.groupNone", undefined, "None")],
          ["cat", t("m.templates.groupCategory", undefined, "Category")],
          ["scope", t("m.templates.groupLibrary", undefined, "Library")],
        ]}
        sort={sort}
        setSort={setSort}
        sortOpts={[
          ["recent", t("m.templates.sortRecent", undefined, "Recent")],
          ["name", t("m.templates.sortName", undefined, "Name")],
          ["uses", t("m.templates.sortUses", undefined, "Most Used")],
        ]}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />

      {groups ? (
        <GroupedList skey="tp" groups={groups} collapsed={collapsed} setCollapsed={setCollapsed} renderRow={(i) => row(i)} />
      ) : (
        visible.map(row)
      )}

      {visible.length === 0 && (
        <EmptySkeleton
          cols={[
            t("m.templates.colTemplate", undefined, "Template"),
            t("m.templates.colCategory", undefined, "Category"),
            t("m.templates.colLibrary", undefined, "Library"),
          ]}
          title={t("m.templates.emptyTitle", undefined, "No Templates")}
          hint={t(
            "m.templates.emptyHint",
            undefined,
            "Save rosters, advances, checklists & contracts here to reuse on future projects.",
          )}
          action={
            canManage ? (
              <Link href="/m/templates/new" className="ps-btn ps-btn--cta ps-btn--sm" style={{ textDecoration: "none" }}>
                {t("m.templates.new", undefined, "New Template")}
              </Link>
            ) : null
          }
        />
      )}

      {open && (
        <RecordDetail
          eyebrow={`${open.categoryLabel} · ${open.scope === "org" ? t("m.templates.scopeOrg", undefined, "Org") : t("m.templates.scopeProject", undefined, "Project")}`}
          title={open.name}
          icon={open.icon}
          status={{
            tone: open.scope === "org" ? "info" : "neutral",
            label: open.scope === "org" ? orgLibLabel : projLibLabel,
          }}
          fields={[
            { k: t("m.templates.colCategory", undefined, "Category"), v: open.categoryLabel },
            {
              k: t("m.templates.colLibrary", undefined, "Library"),
              v: open.scope === "org" ? orgLibLabel : (open.projectName ?? projLibLabel),
            },
            { k: t("m.templates.fieldUses", undefined, "Times Used"), v: String(open.uses) },
            { k: t("m.templates.fieldUpdated", undefined, "Updated"), v: open.updated },
            ...(open.summary ? [{ k: t("m.templates.fieldNotes", undefined, "Notes"), v: open.summary, full: true }] : []),
          ]}
          actions={[
            {
              label: t("m.templates.useTemplate", undefined, "Use Template"),
              icon: "Play",
              primary: true,
              on: () => {
                setOpenId(null);
                onUse(open);
              },
            },
            ...(canManage && open.scope === "project"
              ? [
                  {
                    label: t("m.templates.promote", undefined, "Promote To Org"),
                    icon: "ArrowUpToLine",
                    on: () => {
                      setOpenId(null);
                      onPromote(open);
                    },
                  },
                ]
              : []),
            ...(canManage
              ? [
                  {
                    label: t("m.templates.duplicate", undefined, "Duplicate"),
                    icon: "Copy",
                    on: () => {
                      setOpenId(null);
                      onCopy(open);
                    },
                  },
                  {
                    label: t("m.templates.archive", undefined, "Archive"),
                    icon: "Archive",
                    danger: true,
                    confirmText: t(
                      "m.templates.archiveConfirm",
                      { name: open.name },
                      `Archive "${open.name}"? You can undo for a few seconds.`,
                    ),
                    on: () => {
                      setOpenId(null);
                      onArchive(open);
                    },
                  },
                ]
              : []),
          ]}
          onClose={() => setOpenId(null)}
        />
      )}

      <UndoBar undo={undo} onUndo={clearUndo} undoLabel={t("m.templates.undo", undefined, "Undo")} />
    </div>
  );
}
