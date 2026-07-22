"use client";

import {
  Accessibility, Activity, Anchor, Archive, ArrowDown, ArrowDownLeft, ArrowDownToLine,
  ArrowDownUp, ArrowLeftRight, ArrowRight, ArrowRightLeft, ArrowUp, ArrowUpRight, ArrowUpToLine,
  AtSign, Award, BadgeCheck, Ban, Banknote, BarChart3, Barcode, BedDouble, Bell, BellOff,
  BellRing, Bluetooth, BookOpen, Bookmark, Bot, Boxes, Briefcase, Bug, Building2, Calculator, CalendarCheck,
  CalendarClock, CalendarCog, CalendarDays, CalendarOff, CalendarPlus, CalendarRange, Camera,
  Car, ChartColumn, Check, CheckCheck, CheckCircle2, CheckSquare, ChevronDown, ChevronLeft,
  ChevronRight, ChevronUp, ChevronsDownUp, ChevronsUpDown, Circle, CircleCheck, Clapperboard,
  ClipboardCheck, ClipboardList, ClipboardPen, ClipboardPlus, ClipboardSignature, ClipboardType,
  Clock, Cloud, CloudMoon, CloudOff, CloudSun, CloudUpload, Club, Coffee, Coins, Columns3,
  Compass, ConciergeBell, Construction, Contact, Copy, Crosshair, DollarSign, DoorOpen, Download, Drama,
  EllipsisVertical, ExternalLink, Eye, EyeOff, File, FileBox, FileCheck, FileClock,
  FileSignature, FileSpreadsheet, FileStack, FileText, Files, Fingerprint, Flag, Flame,
  FolderKanban, FolderOpen, Footprints, Gavel, Gift, GitCommitHorizontal, Globe, GraduationCap,
  Group, Hammer, Handshake, HardHat, Headset, HeartHandshake, HelpCircle, History, House, IdCard,
  Image, Inbox, Infinity, Info, Instagram, KeyRound, Landmark, Languages, Layers, LayoutGrid,
  LayoutTemplate, Library, LifeBuoy, Lightbulb, Link, Link2, Linkedin, List, ListChecks,
  ListOrdered, ListPlus, Lock, LogOut, Mail, Map, MapPin, MapPinOff, Megaphone, MessageCircle,
  MessageCircleQuestion, MessageSquare, MessageSquarePlus, MessagesSquare, Mic, Minus, MonitorOff,
  MoveHorizontal, Music, Navigation, Network, NotebookPen, Package, PackageCheck, PackageOpen,
  PackageSearch, Paperclip, PauseCircle, PenSquare, PencilRuler, Phone, PiggyBank, Plane,
  PlaneLanding, Play, Plus, Power, QrCode, Radio, RadioTower, Receipt, ReceiptText, Recycle,
  RefreshCw, Repeat, RotateCcw, Route, Rows3, Ruler, Scale, ScanLine, ScrollText, Search,
  SearchCheck, SearchX, Send, Settings, Share2, Shield, ShieldAlert, ShieldCheck, Shirt,
  ShoppingCart, Siren, SlidersHorizontal, Smartphone, Sparkles, Spline, SquareCheck, Star,
  StickyNote, Store, Sun, SunMoon, Table2, TableRowsSplit, Tag, Tags, Telescope, Tent, ThumbsUp,
  Ticket, Timer, Toilet, Trash2, TrendingUp, TriangleAlert, Truck, Type, Undo2, Upload, User,
  UserCheck, UserCircle, UserCog, UserPlus, UserRoundPlus, UserX, Users, UsersRound, Utensils,
  UtensilsCrossed, Vibrate, Volume2, Wallet, Weight, Wine, Wrench, XCircle, Zap,
  // kit 33 v3.0 additions (nav-drawer, ops ledgers, aurora chat).
  ChartNoAxesColumn, FileWarning, Moon, UserRoundCheck, Users2, X,
  // kit 34 additions (view engine drawers, hub chrome).
  Share, Printer, Sheet, Braces, Webhook, Code, Stamp, Settings2, Waypoints, Fence, SunMedium, CarFront, Warehouse,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CSSProperties, MouseEventHandler } from "react";

/**
 * KIcon — the single icon primitive for the COMPVSS mobile kit.
 *
 * Resolves a Lucide component by PascalCase name and renders it. The prior
 * implementation did `import * as Lucide` and indexed the namespace by a
 * runtime string, which is un-tree-shakeable: the whole ~1,600-icon library
 * shipped to every /m route. This explicit ICONS registry imports only the
 * icons the mobile shell actually references, so the bundler tree-shakes the
 * rest. An unknown name degrades to a HelpCircle fallback (dev warns) rather
 * than crashing — matching the old graceful no-op, but visible.
 *
 * Adding a new icon name to a /m surface? Add it to the import + ICONS below.
 * `src/components/mobile/kit/icon.test.ts` guards that every static `name="…"`
 * literal in the mobile scope is registered.
 */
const ICONS: Record<string, LucideIcon> = {
  Accessibility, Activity, Anchor, Archive, ArrowDown, ArrowDownLeft, ArrowDownToLine,
  ArrowDownUp, ArrowLeftRight, ArrowRight, ArrowRightLeft, ArrowUp, ArrowUpRight, ArrowUpToLine,
  AtSign, Award, BadgeCheck, Ban, Banknote, BarChart3, Barcode, BedDouble, Bell, BellOff,
  BellRing, Bluetooth, BookOpen, Bookmark, Bot, Boxes, Briefcase, Bug, Building2, Calculator, CalendarCheck,
  CalendarClock, CalendarCog, CalendarDays, CalendarOff, CalendarPlus, CalendarRange, Camera,
  Car, ChartColumn, Check, CheckCheck, CheckCircle2, CheckSquare, ChevronDown, ChevronLeft,
  ChevronRight, ChevronUp, ChevronsDownUp, ChevronsUpDown, Circle, CircleCheck, Clapperboard,
  ClipboardCheck, ClipboardList, ClipboardPen, ClipboardPlus, ClipboardSignature, ClipboardType,
  Clock, Cloud, CloudMoon, CloudOff, CloudSun, CloudUpload, Club, Coffee, Coins, Columns3,
  Compass, ConciergeBell, Construction, Contact, Copy, Crosshair, DollarSign, DoorOpen, Download, Drama,
  EllipsisVertical, ExternalLink, Eye, EyeOff, File, FileBox, FileCheck, FileClock,
  FileSignature, FileSpreadsheet, FileStack, FileText, Files, Fingerprint, Flag, Flame,
  FolderKanban, FolderOpen, Footprints, Gavel, Gift, GitCommitHorizontal, Globe, GraduationCap,
  Group, Hammer, Handshake, HardHat, Headset, HeartHandshake, HelpCircle, History, House, IdCard,
  Image, Inbox, Infinity, Info, Instagram, KeyRound, Landmark, Languages, Layers, LayoutGrid,
  LayoutTemplate, Library, LifeBuoy, Lightbulb, Link, Link2, Linkedin, List, ListChecks,
  ListOrdered, ListPlus, Lock, LogOut, Mail, Map, MapPin, MapPinOff, Megaphone, MessageCircle,
  MessageCircleQuestion, MessageSquare, MessageSquarePlus, MessagesSquare, Mic, Minus, MonitorOff,
  MoveHorizontal, Music, Navigation, Network, NotebookPen, Package, PackageCheck, PackageOpen,
  PackageSearch, Paperclip, PauseCircle, PenSquare, PencilRuler, Phone, PiggyBank, Plane,
  PlaneLanding, Play, Plus, Power, QrCode, Radio, RadioTower, Receipt, ReceiptText, Recycle,
  RefreshCw, Repeat, RotateCcw, Route, Rows3, Ruler, Scale, ScanLine, ScrollText, Search,
  SearchCheck, SearchX, Send, Settings, Share2, Shield, ShieldAlert, ShieldCheck, Shirt,
  ShoppingCart, Siren, SlidersHorizontal, Smartphone, Sparkles, Spline, SquareCheck, Star,
  StickyNote, Store, Sun, SunMoon, Table2, TableRowsSplit, Tag, Tags, Telescope, Tent, ThumbsUp,
  Ticket, Timer, Toilet, Trash2, TrendingUp, TriangleAlert, Truck, Type, Undo2, Upload, User,
  UserCheck, UserCircle, UserCog, UserPlus, UserRoundPlus, UserX, Users, UsersRound, Utensils,
  UtensilsCrossed, Vibrate, Volume2, Wallet, Weight, Wine, Wrench, XCircle, Zap,
  // kit 33 v3.0 additions (nav-drawer, ops ledgers, aurora chat).
  ChartNoAxesColumn, FileWarning, Moon, UserRoundCheck, Users2, X,
  // kit 34 additions (view engine drawers, hub chrome).
  Share, Printer, Sheet, Braces, Webhook, Code, Stamp, Settings2, Waypoints, Fence, SunMedium, CarFront, Warehouse,
};

export type KIconProps = {
  name: string;
  size?: number;
  stroke?: number;
  style?: CSSProperties;
  className?: string;
  onClick?: MouseEventHandler<SVGSVGElement>;
};

export function KIcon({ name, size = 20, stroke = 2, style, className, onClick }: KIconProps) {
  // Kit icons are decorative by default — labels live on the wrapping control
  // (button aria-label / adjacent text). Hide from AT unless the icon itself
  // is the interactive element (legacy onClick usage).
  const hidden = onClick ? undefined : true;
  const Cmp = ICONS[name];
  if (!Cmp) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[KIcon] no registry entry for "${name}" — add it to src/components/mobile/kit/icon.tsx`);
    }
    return <HelpCircle size={size} strokeWidth={stroke} style={style} className={className} onClick={onClick} aria-hidden={hidden} />;
  }
  return <Cmp size={size} strokeWidth={stroke} style={style} className={className} onClick={onClick} aria-hidden={hidden} />;
}
