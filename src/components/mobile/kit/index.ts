/**
 * COMPVSS mobile interaction primitives — typed, "use client" components
 * ported from the field-PWA prototype. Generic + presentational: callers
 * pass already-translated labels and data; no i18n, no Supabase here.
 */
export { KIcon } from "./icon";
export type { KIconProps } from "./icon";

export { toneToBadge } from "./badge";

export { Fab } from "./Fab";
export type { FabProps } from "./Fab";

export { PillMenu, Popover, TogRow, mkItems } from "./Menu";
export type { PillMenuProps, PopoverProps, TogRowProps, MenuItem } from "./Menu";

export { GroupedList } from "./GroupedList";
export type { GroupedListProps } from "./GroupedList";

export { ProgressRing } from "./ProgressRing";
export type { ProgressRingProps } from "./ProgressRing";

export { RelTime } from "./RelTime";
export type { RelTimeProps } from "./RelTime";

export { RecentRail } from "./RecentRail";

export { CommentsBlock } from "./CommentsBlock";
export type { CommentsBlockProps, Comment } from "./CommentsBlock";

export { ItemUnits } from "./ItemUnits";
export type { ItemUnitsProps, Unit, UnitTone } from "./ItemUnits";

export { SwipeRow, SW_TONE } from "./SwipeRow";
export type { SwipeRowProps, SwipeAction, SwipeTone } from "./SwipeRow";

export { Crumbs } from "./Crumbs";
export type { CrumbsProps, Crumb } from "./Crumbs";

export { SheetHead } from "./SheetHead";
export type { SheetHeadProps } from "./SheetHead";

export { Sheet } from "./Sheet";
export type { SheetProps } from "./Sheet";

export { SyncBadge } from "./SyncBadge";
export type { SyncBadgeProps, SyncBadgeState } from "./SyncBadge";

export { LockedRow } from "./AskLead";
export type { LockedRowProps } from "./AskLead";

export { EmptySkeleton } from "./EmptySkeleton";
export type { EmptySkeletonProps } from "./EmptySkeleton";

export { UndoBar, useUndo } from "./UndoBar";
export type { UndoBarProps, UndoState } from "./UndoBar";

export {
  DataTable,
  FilterBuilder,
  SortBuilder,
  applyView,
  evalRule,
  FILTER_OPS,
} from "./DataTable";
export type {
  DataTableProps,
  FilterBuilderProps,
  SortBuilderProps,
  FieldDef,
  FieldType,
  FilterOp,
  FilterRule,
  SortRule,
  Conjunction,
} from "./DataTable";

export { ViewToggle, VIEW_ICON } from "./ViewToggle";
export type { ViewToggleProps, ViewMode } from "./ViewToggle";

export {
  DataView,
  GroupedTree,
  ViewSheet,
  ShareSheet,
  FilterGroups,
  SortReorder,
  GroupBuilder,
  applyModel,
  groupTree,
  evalFilterModel,
  evalRuleModel,
  emptyFilterModel,
  countFilterRules,
  dataPills,
  advBar,
  emptyViewCtl,
  MODEL_FILTER_OPS,
  NOW_ISO,
} from "./viewengine";
export type {
  FilterModel,
  FilterGroup,
  ModelRule,
  ModelFilterOp,
  GroupNode,
  ViewCtl,
  Conj,
} from "./viewengine";

export { MetricBar, ViewSeg } from "./MetricBar";
export type { MetricBarItem, ViewSegItem } from "./MetricBar";

export { ScreenHeader } from "./ScreenHeader";
export type { ScreenHeaderProps } from "./ScreenHeader";

export { Block, ListRow, MetricGrid, MeterRow, pressable } from "./blocks";
export type { MetricCell } from "./blocks";

export { NormalizedList } from "./NormalizedList";
export type { NormalizedListProps } from "./NormalizedList";

export { ActionBar } from "./ActionBar";
export type { ActionBarProps, ActionBarPill } from "./ActionBar";

export { RoseCard, QR, hashStr } from "./RoseCard";
export type { RoseCardProps, QRProps } from "./RoseCard";

export { FORMS, EXPENSE_AUTO_CODE } from "./forms";
export type { Forms, FormDef, FormField, FormFieldType } from "./forms";

export { FormScreen, Field, ComboField, AvatarField, TIER_COLOR } from "./FormScreen";

export { RecordDetail } from "./RecordDetail";
export type {
  RecordDetailProps,
  RecordStatus,
  RecordField,
  RecordRow,
  RecordTimelineEntry,
  RecordSection,
  RecordAction,
  RecordComment,
} from "./RecordDetail";

export {
  ToolSheet,
  TOOLS,
  UNITS,
  OPS_CALCS,
  OSHA,
  HOURLY,
  ICON_FOR,
  CHANNELS,
  CHECKLISTS,
  CHECKLIST_TEAMS,
} from "./ToolSheet";
export type { Tool, Toast, OpsCalcDef, OshaStandard, Checklist } from "./ToolSheet";
