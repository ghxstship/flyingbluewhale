/**
 * COMPVSS mobile interaction primitives — typed, "use client" components
 * ported from the field-PWA prototype. Generic + presentational: callers
 * pass already-translated labels and data; no i18n, no Supabase here.
 */
export { KIcon } from "./icon";
export type { KIconProps } from "./icon";

export { PillMenu, Popover, TogRow, mkItems } from "./Menu";
export type { PillMenuProps, PopoverProps, TogRowProps, MenuItem } from "./Menu";

export { GroupedList } from "./GroupedList";
export type { GroupedListProps } from "./GroupedList";

export { CommentsBlock } from "./CommentsBlock";
export type { CommentsBlockProps, Comment } from "./CommentsBlock";

export { ItemUnits } from "./ItemUnits";
export type { ItemUnitsProps, Unit, UnitTone } from "./ItemUnits";

export { SwipeRow, SW_TONE } from "./SwipeRow";
export type { SwipeRowProps, SwipeAction, SwipeTone } from "./SwipeRow";

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

export { ActionBar } from "./ActionBar";
export type { ActionBarProps } from "./ActionBar";

export { RoseCard, QR, hashStr } from "./RoseCard";
export type { RoseCardProps, QRProps } from "./RoseCard";

export { FORMS } from "./forms";
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
