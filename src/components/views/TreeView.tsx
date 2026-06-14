"use client";

/**
 * <TreeView> — collapsible hierarchy renderer for collection pages whose
 * rows form a parent/child tree (Phase 3.x of the SmartSuite view-matrix
 * parity; the "tree" `DataViewKind`). Eligible when rows carry a
 * `parent_id` (adjacency list) or a `wbs_path` (materialized path, e.g.
 * "1.2.3"). The caller flattens its rows into {id, parentId, ...} nodes
 * and `buildTree` assembles the nesting.
 *
 *     <TreeView nodes={tasks.map(toNode)} />
 *
 * Token/.ps-* styled only — no hex, no hardcoded fonts. "use client"
 * because expand/collapse is local UI state.
 */

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useT } from "@/lib/i18n/LocaleProvider";

export type TreeNode = {
  id: string;
  /** Parent node id, or null/undefined for a root. */
  parentId?: string | null;
  /** Primary label. */
  title: string;
  /** Optional secondary text (right-aligned, muted). */
  subtitle?: string | null;
  /** Optional state/phase rendered as a <StatusBadge>. NEVER a bare
   *  status field — pass *_state / *_phase. */
  state?: string | null;
  /** Optional detail href — makes the row label a link. */
  href?: string;
  /** Optional caller data for callbacks. */
  data?: Record<string, unknown>;
};

/** Internal nested shape produced by buildTree. */
export type TreeNodeWithChildren = TreeNode & { children: TreeNodeWithChildren[]; depth: number };

export type TreeViewProps = {
  nodes: TreeNode[];
  /** Start fully expanded. Default true. */
  initiallyExpanded?: boolean;
  /** Empty-state copy. */
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
};

/**
 * Assemble a flat adjacency list into a nested tree. Nodes whose
 * `parentId` is missing from the set are treated as roots (orphan-safe so
 * a filtered slice still renders). Stable: preserves input order within
 * each sibling group.
 */
export function buildTree(nodes: TreeNode[]): TreeNodeWithChildren[] {
  const byId = new Map<string, TreeNodeWithChildren>();
  for (const n of nodes) byId.set(n.id, { ...n, children: [], depth: 0 });

  const roots: TreeNodeWithChildren[] = [];
  for (const n of nodes) {
    const node = byId.get(n.id)!;
    const parent = n.parentId ? byId.get(n.parentId) : undefined;
    if (parent && parent.id !== node.id) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Assign depth via a stack walk.
  const stack: TreeNodeWithChildren[] = [...roots];
  while (stack.length) {
    const node = stack.pop()!;
    for (const c of node.children) {
      c.depth = node.depth + 1;
      stack.push(c);
    }
  }
  return roots;
}

export function TreeView({
  nodes,
  initiallyExpanded = true,
  emptyTitle,
  emptyDescription,
  className,
}: TreeViewProps): React.ReactElement {
  const t = useT();
  const roots = React.useMemo(() => buildTree(nodes), [nodes]);

  // Collapsed set — empty means "all expanded" when initiallyExpanded.
  const [collapsed, setCollapsed] = React.useState<Set<string>>(() => {
    if (initiallyExpanded) return new Set();
    return new Set(nodes.filter((n) => !n.parentId).map((n) => n.id));
  });

  const toggle = React.useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  if (nodes.length === 0) {
    return (
      <EmptyState
        title={emptyTitle ?? t("components.treeView.emptyTitle", undefined, "Nothing to Show")}
        description={
          emptyDescription ??
          t("components.treeView.emptyDescription", undefined, "Records nest here by their parent.")
        }
      />
    );
  }

  return (
    <div
      role="tree"
      aria-label={t("components.treeView.label", undefined, "Tree")}
      className={["surface overflow-hidden", className ?? ""].join(" ")}
    >
      {roots.map((node) => (
        <TreeRow key={node.id} node={node} collapsed={collapsed} onToggle={toggle} />
      ))}
    </div>
  );
}

function TreeRow({
  node,
  collapsed,
  onToggle,
}: {
  node: TreeNodeWithChildren;
  collapsed: Set<string>;
  onToggle: (id: string) => void;
}): React.ReactElement {
  const t = useT();
  const hasChildren = node.children.length > 0;
  const isCollapsed = collapsed.has(node.id);

  const label = node.href ? (
    <Link
      href={node.href}
      className="truncate text-sm font-medium text-[var(--p-text-1)] hover:text-[var(--p-accent)]"
    >
      {node.title}
    </Link>
  ) : (
    <span className="truncate text-sm font-medium text-[var(--p-text-1)]">{node.title}</span>
  );

  return (
    <div role="treeitem" aria-selected={false} aria-expanded={hasChildren ? !isCollapsed : undefined}>
      <div
        className="flex items-center gap-2 border-b border-[var(--p-border)] px-3 py-2"
        style={{ paddingInlineStart: `calc(0.75rem + ${node.depth} * 1.25rem)` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggle(node.id)}
            aria-label={
              isCollapsed
                ? t("components.treeView.expand", { title: node.title }, `Expand ${node.title}`)
                : t("components.treeView.collapse", { title: node.title }, `Collapse ${node.title}`)
            }
            className="focus-ring shrink-0 rounded p-0.5 text-[var(--p-text-2)] hover:text-[var(--p-text-1)]"
          >
            <ChevronRight
              size={14}
              aria-hidden="true"
              className={`transition-transform ${isCollapsed ? "" : "rotate-90"}`}
            />
          </button>
        ) : (
          <span aria-hidden="true" className="inline-block w-[18px] shrink-0" />
        )}
        <div className="min-w-0 flex-1">{label}</div>
        {node.subtitle ? (
          <span className="shrink-0 truncate text-xs text-[var(--p-text-2)]">{node.subtitle}</span>
        ) : null}
        {node.state ? (
          <div className="shrink-0">
            <StatusBadge status={node.state} />
          </div>
        ) : null}
      </div>
      {hasChildren && !isCollapsed
        ? node.children.map((child) => (
            <TreeRow key={child.id} node={child} collapsed={collapsed} onToggle={onToggle} />
          ))
        : null}
    </div>
  );
}
