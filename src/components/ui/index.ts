export { Badge } from "./Badge";
export type { BadgeVariant } from "./Badge";
export { Button } from "./Button";
export type { ButtonVariant, ButtonSize, ButtonProps } from "./Button";
export { buttonVariants } from "./Button";
export { Input } from "./Input";
export { Avatar } from "./Avatar";
export type { AvatarSize } from "./Avatar";
export { ProgressBar } from "./ProgressBar";
export { ThemeToggle } from "./ThemeToggle";
export { Card, CardHeader, CardBody, CardFooter } from "./Card";
export { SelectableCard } from "./SelectableCard";
export type { SelectableCardProps } from "./SelectableCard";
export { Spinner } from "./Spinner";
export type { SpinnerSize } from "./Spinner";
export { MetricCard } from "./MetricCard";
export { EmptyState } from "./EmptyState";
export { StatusBadge } from "./StatusBadge";
export { DueDateBadge } from "./DueDateBadge";
export type { DueDateBadgeProps, DueDateStatus } from "./DueDateBadge";
export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "./Dialog";
export { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent, Hint } from "./Tooltip";
export { LiveRegion, LiveRegionProvider, useAnnounce } from "./LiveRegion";
export {
  Select,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectSeparator,
} from "./Select";
export { FormField, FormGrid } from "./FormField";
export { Checkbox, LabeledCheckbox } from "./Checkbox";
export { Switch, LabeledSwitch } from "./Switch";
export { Tabs, TabsList, TabsTrigger, TabsContent, SegmentedControl, SegmentedControlItem } from "./Tabs";
export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "./Sheet";
export { Combobox, MultiCombobox, type ComboboxOption } from "./Combobox";
export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor } from "./Popover";
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuRadioGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuGroup,
  DropdownMenuPortal,
} from "./DropdownMenu";
export { Accordion } from "./Accordion";
export type { AccordionItemData } from "./Accordion";
export { RichTextEditor } from "./RichTextEditor";
export { SignaturePad } from "./SignaturePad";
export { FileViewer } from "./FileViewer";
export { MediaPlayer } from "./MediaPlayer";
export { QuizQuestion } from "./QuizQuestion";
export type { QuizOption } from "./QuizQuestion";
export { FloorPlan } from "./FloorPlan";
export type { FloorPlanPlacement } from "./FloorPlan";
export { CoordinateMatrix, Coordinate } from "./CoordinateMatrix";
export type { CoordinateAxis, CoordinateCell } from "./CoordinateMatrix";
export { GanttChart } from "./GanttChart";
export type { GanttZoom, GanttRow } from "./GanttChart";
export { Steps } from "./Steps";
export type { Step, StepState } from "./Steps";
export { AchievementBadge } from "./AchievementBadge";
export type { AchievementTone } from "./AchievementBadge";
export { LeaderboardRow } from "./LeaderboardRow";
export { LoyaltyTier } from "./LoyaltyTier";
export type { LoyaltyTierTone } from "./LoyaltyTier";
export { ContributionTimeline, ActivityTimeline } from "./ActivityTimeline";
export type { ActivityItem } from "./ActivityTimeline";
// DataView moved: the canonical collection surface is `@/components/views/DataView`
// (Option B, 2026-07-22). The old ui/DataView table⇄grid toggle was absorbed
// by its gallery `renderCard` card-grid mode.

// ── v8.1 inventory-completeness primitives ───────────────────────────────────
// W5 vocabulary consolidation (audit 2026-07-22, owner ruling 3): the 14
// zero-consumer primitives (ButtonGroup, Carousel, DatePicker,
// DescriptionList, MediaCard, Meter, NumberInput, PinInput, RadioGroup,
// RecordHeader, RoleControl, Slider, TimePicker, UploadZone) + ListRow were
// DELETED — native-control canon covers date/time/number/radio inputs,
// ProgressBar covers Meter, git history is the registry. Divider was ADOPTED
// (it absorbed the auth shell's AuthDivider).
export { Divider } from "./Divider";
export type { DividerProps } from "./Divider";
// Toast: the ui/Toast provider system was deleted in the 2026-07-10 audit
// (F-06) — its ToastProvider was never mounted, so the barrel-exported
// useToast threw at runtime. The one sanctioned toast API is
// `@/lib/hooks/useToast` (sonner-backed; <Toaster> mounts in the root layout).
export { ConfirmDialog, ConfirmDialogHost, useConfirm } from "./ConfirmDialog";
export type { ConfirmTone, ConfirmDialogProps, ConfirmRequest } from "./ConfirmDialog";
export { Coachmark, Tour } from "./Coachmark";
export type { CoachmarkProps, TourStep, TourProps, CoachmarkBubbleContentProps } from "./Coachmark";
// Pagination / BulkActionBar / ExportMenu / ImportPanel were removed in the
// 2026-07-10 audit (A-15): dead duplicates with zero consumers — the DataTable
// engine (DataTableInteractive) implements pagination, bulk actions, CSV
// export, and import natively; server pages paginate with PagerNav.
