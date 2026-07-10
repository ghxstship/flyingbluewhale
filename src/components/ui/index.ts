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
export { DatePicker } from "./DatePicker";
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
export { ActivityTimeline } from "./ActivityTimeline";
export type { ActivityItem } from "./ActivityTimeline";
export { DataView } from "./DataView";
export type { DataViewColumn } from "./DataView";

// ── v8.1 inventory-completeness primitives ───────────────────────────────────
export { Divider } from "./Divider";
export type { DividerProps } from "./Divider";
export { ButtonGroup, SplitButton } from "./ButtonGroup";
export type { ButtonGroupProps, SplitButtonProps } from "./ButtonGroup";
export { DescriptionList } from "./DescriptionList";
export type { DescriptionItem, DescriptionListProps } from "./DescriptionList";
export { RecordHeader } from "./RecordHeader";
export type { RecordHeaderProps } from "./RecordHeader";
export { Slider } from "./Slider";
export type { SliderProps } from "./Slider";
export { NumberInput } from "./NumberInput";
export type { NumberInputProps } from "./NumberInput";
export { TimePicker } from "./TimePicker";
export type { TimePickerProps } from "./TimePicker";
export { PinInput } from "./PinInput";
export type { PinInputProps } from "./PinInput";
export { RadioGroup } from "./RadioGroup";
export type { RadioGroupProps, RadioOption } from "./RadioGroup";
// Toast: the ui/Toast provider system was deleted in the 2026-07-10 audit
// (F-06) — its ToastProvider was never mounted, so the barrel-exported
// useToast threw at runtime. The one sanctioned toast API is
// `@/lib/hooks/useToast` (sonner-backed; <Toaster> mounts in the root layout).
export { ConfirmDialog, ConfirmDialogHost, useConfirm } from "./ConfirmDialog";
export type { ConfirmTone, ConfirmDialogProps, ConfirmRequest } from "./ConfirmDialog";
export { Meter } from "./Meter";
export type { MeterTone, MeterVariant, MeterProps } from "./Meter";
export { Coachmark, Tour } from "./Coachmark";
export type { CoachmarkProps, TourStep, TourProps, CoachmarkBubbleContentProps } from "./Coachmark";
// Pagination / BulkActionBar / ExportMenu / ImportPanel were removed in the
// 2026-07-10 audit (A-15): dead duplicates with zero consumers — the DataTable
// engine (DataTableInteractive) implements pagination, bulk actions, CSV
// export, and import natively; server pages paginate with PagerNav.
export { UploadZone } from "./UploadZone";
export type { UploadZoneProps, UploadRejection } from "./UploadZone";
export { MediaCard } from "./MediaCard";
export type { MediaCardProps, MediaCardAspect } from "./MediaCard";
export { Carousel } from "./Carousel";
export type { CarouselProps } from "./Carousel";
export { ListRow } from "./ListRow";
export type { ListRowProps } from "./ListRow";
export { RoleControl } from "./RoleControl";
export type { RoleControlProps, RoleOption } from "./RoleControl";
// Kit-vocabulary synonym (REPO_PARITY_HANDOFF_2 §4): the kit names this role
// picker `RoleSelect`; alias so both vocabularies resolve rather than forking a
// duplicate (mirrors the Coachmark/Tour dual-export above).
export { RoleControl as RoleSelect } from "./RoleControl";
export type { RoleControlProps as RoleSelectProps } from "./RoleControl";
