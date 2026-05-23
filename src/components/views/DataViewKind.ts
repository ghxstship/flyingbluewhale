/**
 * Canonical collection-page view types. Data shape decides which are
 * eligible on a given page; each collection declares its supported set
 * via `<DataViewSwitcher allowed={…}>`.
 *
 * - table     — universal default, sortable grid with column headers
 * - list      — single-column flat list (denser than table; mobile-first)
 * - board     — Kanban columns; requires a status/state enum
 * - timeline  — Gantt-style bars; requires date fields (due_at, starts_at)
 * - calendar  — month/week/day grid; same date eligibility as timeline
 * - map       — geographic placement; requires location_id / lat·lng
 * - gallery   — thumbnail cards; requires a media or preview field
 * - tree      — hierarchical rollup; requires parent_id or wbs_path
 */
export type DataViewKind = "table" | "list" | "board" | "timeline" | "calendar" | "map" | "gallery" | "tree";
