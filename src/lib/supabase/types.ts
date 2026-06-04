// Org-level role (billing/governance). One per (org, user).
export type PlatformRole = "owner" | "admin" | "manager" | "member";
export const PLATFORM_ROLES = ["owner", "admin", "manager", "member"] as const;

// Project-level role (operations). One per (project, user).
export type ProjectRole = "lead" | "editor" | "contributor" | "viewer" | "vendor";
export const PROJECT_ROLES = ["lead", "editor", "contributor", "viewer", "vendor"] as const;

export type Tier = "access" | "core" | "professional" | "enterprise";

// Session-derived persona — drives shell + nav routing AND the per-persona
// capability matrix. Sourced from `memberships.persona` (SQL column added
// in migration `memberships_persona_column`); falls back to role for
// pre-migration data.
//
//   visitor       — unauthenticated
//   guest         — authenticated, demo-org member only (no real org yet)
//   owner/admin/  — derived from PlatformRole when persona col was role-based
//   manager/member  on row insert (legacy or default)
//   collaborator  — co-producer with project-level write authority (member tier)
//   contractor    — vendor / outside contributor; project-read + task-write
//   crew          — gate / shift / scan operator (member tier, mobile-first)
//   client        — proposal recipient / portal viewer (read-only)
//   viewer        — generic read-only stakeholder
//   community     — public marketplace browser; no write capabilities
export type Persona =
  | "visitor"
  | "guest"
  | "owner"
  | "admin"
  | "manager"
  | "member"
  | "collaborator"
  | "contractor"
  | "crew"
  | "client"
  | "viewer"
  | "community";

export const PERSONAS = [
  "visitor",
  "guest",
  "owner",
  "admin",
  "manager",
  "member",
  "collaborator",
  "contractor",
  "crew",
  "client",
  "viewer",
  "community",
] as const;

/**
 * Project operational state (cyclical/non-sequential, distinct from the
 * `xpms_phase` sequential macro arc). Per LDP §NAMING DISCIPLINE the
 * column is `project_state`; the type alias retains the historical
 * `ProjectStatus` name for source-level call-site stability — flip the
 * alias to `ProjectState` in a follow-up rename PR if desired.
 */
export type ProjectStatus = "draft" | "active" | "paused" | "archived" | "complete";
export type ProjectState = ProjectStatus;
// Canonical lifecycle for both deliverables (project documents) and
// assignments (per-individual entitlements). Mirrors public.fulfillment_state
// renamed from fulfillment_state in migration 0061.
export type FulfillmentState =
  | "briefed"
  | "draft"
  | "submitted"
  | "in_review"
  | "approved"
  | "rejected"
  | "revision_requested"
  | "delivered"
  | "issued"
  | "transferred"
  | "redeemed"
  | "expired"
  | "voided"
  | "returned";
export type DeliverableType =
  | "technical_rider"
  | "hospitality_rider"
  | "input_list"
  | "stage_plot"
  | "crew_list"
  | "guest_list"
  | "equipment_pull_list"
  | "power_plan"
  | "rigging_plan"
  | "site_plan"
  | "build_schedule"
  | "vendor_package"
  | "safety_compliance"
  | "comms_plan"
  | "signage_grid"
  | "custom";
export type LeadStage = "new" | "qualified" | "contacted" | "proposal" | "won" | "lost";
export type ProposalStatus = "draft" | "sent" | "approved" | "rejected" | "expired" | "signed";
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "voided";
export type ExpenseStatus = "pending" | "approved" | "rejected" | "reimbursed";
export type POStatus = "draft" | "sent" | "acknowledged" | "fulfilled" | "cancelled";
export type ReqStatus = "draft" | "submitted" | "approved" | "rejected" | "converted";
export type EquipmentStatus = "available" | "reserved" | "in_use" | "maintenance" | "retired";
export type TaskStatus = "todo" | "in_progress" | "blocked" | "review" | "done";
export type EventStatus = "draft" | "scheduled" | "live" | "complete" | "cancelled";
export type FabricationStatus = "open" | "in_progress" | "blocked" | "complete";
export type AnnotationKind = "flag" | "note" | "comment" | "tag";
export type AnnotationSeverity = "info" | "warning" | "critical";
export type AnnotationStatus = "open" | "acknowledged" | "resolved" | "dismissed";

export type Annotation = {
  id: string;
  org_id: string;
  project_id: string | null;
  target_table: string;
  target_id: string;
  parent_id: string | null;
  kind: AnnotationKind;
  severity: AnnotationSeverity;
  status: AnnotationStatus;
  title: string | null;
  body: string;
  tags: string[];
  confirmation_required: boolean;
  confirmed_by: string | null;
  confirmed_at: string | null;
  due_at: string | null;
  assigned_to: string | null;
  linked_task_id: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_note: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AnnotationWatcher = {
  annotation_id: string;
  user_id: string;
  created_at: string;
};

type TableDef<R, I, U> = { Row: R; Insert: I; Update: U; Relationships: [] };

// Core entities
export type Org = {
  id: string;
  slug: string;
  name: string;
  tier: Tier;
  default_locale: string;
  default_timezone: string;
  default_currency: string;
  created_at: string;
};
export type User = { id: string; email: string; name: string | null; avatar_url: string | null; created_at: string };
export type Membership = {
  id: string;
  org_id: string;
  user_id: string;
  role: PlatformRole;
  is_developer: boolean;
  created_at: string;
};

export type ProjectMember = {
  id: string;
  project_id: string;
  user_id: string;
  role: ProjectRole;
  created_at: string;
  updated_at: string;
};

export type XpmsPhaseEnum = "discovery" | "concept" | "development" | "advance" | "build" | "show" | "strike" | "wrap";
export type GeographicScope = "local" | "regional" | "national" | "international";
export type TourStructure = "single_stop" | "multi_stop_sequential" | "simultaneous_multi_city";
export type ProductionStyle = "editorial" | "documentary" | "narrative" | "spectacle" | "intimate" | "brutalist";

export type Project = {
  id: string;
  org_id: string;
  slug: string;
  name: string;
  description: string | null;
  project_state: ProjectStatus;
  xpms_phase: XpmsPhaseEnum | null;
  start_date: string | null;
  end_date: string | null;
  client_id: string | null;
  primary_venue_id: string | null;
  budget_cents: number | null;
  geographic_scope: GeographicScope | null;
  tour_structure: TourStructure | null;
  production_style: ProductionStyle | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type Deliverable = {
  id: string;
  org_id: string;
  project_id: string;
  type: DeliverableType;
  title: string | null;
  fulfillment_state: FulfillmentState;
  data: unknown;
  file_path: string | null;
  version: number;
  submitted_by: string | null;
  reviewed_by: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  deadline: string | null;
  created_at: string;
  updated_at: string;
};
export type DeliverableComment = {
  id: string;
  deliverable_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

// Sales / CRM
export type Client = {
  id: string;
  org_id: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
export type Lead = {
  id: string;
  org_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  stage: LeadStage;
  estimated_value_cents: number | null;
  assigned_to: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
export type Proposal = {
  id: string;
  org_id: string;
  project_id: string | null;
  client_id: string | null;
  title: string;
  amount_cents: number | null;
  status: ProposalStatus;
  sent_at: string | null;
  signed_at: string | null;
  expires_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  doc_number: string | null;
  version: number;
  theme: { primary: string; secondary: string };
  blocks: unknown;
  signer_name: string | null;
  signer_email: string | null;
  signature_hash: string | null;
  signature_data: string | null;
  deposit_percent: number;
  currency: string;
};

export type ProposalShareLink = {
  id: string;
  proposal_id: string;
  token: string;
  audience: string | null;
  created_by: string | null;
  expires_at: string | null;
  last_viewed_at: string | null;
  view_count: number;
  revoked_at: string | null;
  created_at: string;
};

export type ProposalSignature = {
  id: string;
  proposal_id: string;
  share_token: string | null;
  signer_name: string;
  signer_email: string | null;
  signer_ip: string | null;
  signer_role: string | null;
  signature_kind: "typed" | "canvas";
  signature_hash: string;
  signature_data: string | null;
  signed_at: string;
};

// Finance
export type Invoice = {
  id: string;
  org_id: string;
  project_id: string | null;
  client_id: string | null;
  number: string;
  title: string;
  amount_cents: number;
  currency: string;
  status: InvoiceStatus;
  issued_at: string | null;
  due_at: string | null;
  paid_at: string | null;
  stripe_payment_intent: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
export type InvoiceLineItem = {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price_cents: number;
  position: number;
};
export type Expense = {
  id: string;
  org_id: string;
  project_id: string | null;
  submitter_id: string;
  category: string | null;
  description: string;
  amount_cents: number;
  currency: string;
  status: ExpenseStatus;
  receipt_path: string | null;
  spent_at: string;
  created_at: string;
  updated_at: string;
  // XPMS Universal Budget Template v08 taxonomy (migration 0071).
  department: string | null;
  class: string | null;
  item: string | null;
  discipline: string | null;
  xpms_phase: string | null;
  vendor: string | null;
  expense_type: string | null;
  method_of_payment: string | null;
  invoice: string | null;
  due_date: string | null;
  payment_date: string | null;
  confirmation: string | null;
  flag: boolean;
  external_notes: string | null;
  internal_notes: string | null;
};
export type Budget = {
  id: string;
  org_id: string;
  project_id: string | null;
  name: string;
  category: string | null;
  amount_cents: number;
  spent_cents: number;
  created_at: string;
  updated_at: string;
  // XPMS Universal Budget Template v08 taxonomy (migration 0070).
  event: string | null;
  location: string | null;
  activation: string | null;
  department: string | null;
  team: string | null;
  class: string | null;
  item: string | null;
  discipline: string | null;
  xpms_phase: string | null;
  tier: string | null;
  xyz: string | null;
  line_type: string;
  quantity: number | null;
  rate_cents: number | null;
  estimate_cents: number | null;
  actual_cents: number | null;
  vendor: string | null;
  budget_status: string | null;
  flag: boolean;
  external_notes: string | null;
  internal_notes: string | null;
  forecast_cents: number;
  committed_cents: number;
  eac_cents: number;
  code: string | null;
  notes: string | null;
  xtc_code: number | null;
};
export type TimeEntry = {
  id: string;
  org_id: string;
  project_id: string | null;
  user_id: string;
  description: string | null;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  billable: boolean;
  created_at: string;
  updated_at: string;
};
export type MileageLog = {
  id: string;
  org_id: string;
  project_id: string | null;
  user_id: string;
  origin: string;
  destination: string;
  miles: number;
  rate_cents: number;
  logged_on: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

// Procurement
export type Vendor = {
  id: string;
  org_id: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  category: string | null;
  w9_on_file: boolean;
  coi_expires_at: string | null;
  payout_account_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
export type Requisition = {
  id: string;
  org_id: string;
  project_id: string | null;
  requester_id: string;
  title: string;
  description: string | null;
  estimated_cents: number | null;
  status: ReqStatus;
  created_at: string;
  updated_at: string;
};
export type PurchaseOrder = {
  id: string;
  org_id: string;
  project_id: string | null;
  vendor_id: string | null;
  requisition_id: string | null;
  number: string;
  title: string;
  amount_cents: number;
  currency: string;
  status: POStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
export type POLineItem = {
  id: string;
  purchase_order_id: string;
  description: string;
  quantity: number;
  unit_price_cents: number;
  position: number;
};

// Production
export type Equipment = {
  id: string;
  org_id: string;
  name: string;
  category: string | null;
  asset_tag: string | null;
  serial: string | null;
  status: EquipmentStatus;
  location_id: string | null;
  daily_rate_cents: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
export type Rental = {
  id: string;
  org_id: string;
  project_id: string | null;
  equipment_id: string;
  starts_at: string;
  ends_at: string;
  rate_cents: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
export type FabricationOrder = {
  id: string;
  org_id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  due_at: string | null;
  status: FabricationStatus;
  created_at: string;
  updated_at: string;
};

// Ops
export type Task = {
  id: string;
  org_id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: number;
  due_at: string | null;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
export type EventRow = {
  id: string;
  org_id: string;
  project_id: string | null;
  name: string;
  starts_at: string;
  ends_at: string;
  location_id: string | null;
  status: EventStatus;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
export type Location = {
  id: string;
  org_id: string;
  name: string;
  address: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  postcode: string | null;
  lat: number | null;
  lng: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
export type CrewMember = {
  id: string;
  org_id: string;
  user_id: string | null;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  day_rate_cents: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
export type Credential = {
  id: string;
  org_id: string;
  crew_member_id: string | null;
  kind: string;
  number: string | null;
  issued_on: string | null;
  expires_on: string | null;
  file_path: string | null;
  created_at: string;
  updated_at: string;
};

// AI + system
export type AIConversation = { id: string; org_id: string; user_id: string; title: string; created_at: string };
export type AIMessage = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  created_at: string;
};
export type AuditLog = {
  id: string;
  org_id: string;
  actor_id: string | null;
  action: string;
  target_table: string | null;
  target_id: string | null;
  metadata: unknown;
  at: string;
};
export type Notification = {
  id: string;
  org_id: string;
  user_id: string;
  title: string;
  body: string | null;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

// 8 counted personas + 1 uncounted (`custom` = Temporary Access).
// `client` is reserved; not currently surfaced as a chip-bar option.
export type GuidePersona =
  | "staff"
  | "crew"
  | "vendor"
  | "brand_ambassador"
  | "sponsor"
  | "artist"
  | "media_press"
  | "client"
  | "guest"
  | "custom";
export type EventGuide = {
  id: string;
  org_id: string;
  project_id: string;
  persona: GuidePersona;
  tier: number;
  classification: string | null;
  slug: string | null;
  title: string;
  subtitle: string | null;
  published: boolean;
  config: unknown;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

// ═══ Olympic-scope row types (migration 0030) ═════════════════════════════
export type RiskLikelihood = "rare" | "unlikely" | "possible" | "likely" | "almost_certain";
export type RiskImpact = "insignificant" | "minor" | "moderate" | "major" | "severe";
export type RiskStatus = "open" | "mitigating" | "accepted" | "closed";
export type RaidKind = "risk" | "assumption" | "issue" | "dependency";
export type VenueKind = "competition" | "training" | "live_site" | "ibc" | "mpc" | "village" | "support";
export type HandoverState = "not_started" | "inspection" | "snag" | "sign_off" | "accepted" | "closeout";
export type AccreditationState = "applied" | "vetting" | "approved" | "issued" | "suspended" | "revoked" | "expired";
export type VettingState = "pending" | "in_progress" | "clear" | "flagged" | "failed";
export type WorkforceKind = "paid_staff" | "volunteer" | "contractor" | "official";
export type RosterState = "draft" | "published" | "locked";
export type ShiftAttendance = "scheduled" | "checked_in" | "on_break" | "checked_out" | "no_show";
export type DispatchFleet = "t1" | "t2" | "t3" | "media" | "workforce" | "spectator";
export type DsarKind = "access" | "deletion" | "correction" | "portability" | "objection";
export type DsarStatus = "received" | "verifying" | "in_progress" | "fulfilled" | "rejected";

export type Risk = {
  id: string;
  org_id: string;
  project_id: string | null;
  kind: RaidKind;
  title: string;
  description: string | null;
  category: string | null;
  likelihood: RiskLikelihood;
  impact: RiskImpact;
  inherent_score: number;
  residual_score: number | null;
  status: RiskStatus;
  owner_id: string | null;
  treatment: string | null;
  due_on: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
export type ProgramReview = {
  id: string;
  org_id: string;
  title: string;
  scheduled_at: string;
  attendees: unknown;
  agenda: unknown;
  actions: unknown;
  decisions: unknown;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
export type ReadinessExercise = {
  id: string;
  org_id: string;
  project_id: string | null;
  name: string;
  kind: string;
  scheduled_at: string | null;
  scenario: unknown;
  injects: unknown;
  aar: unknown;
  created_at: string;
  updated_at: string;
};
export type Venue = {
  id: string;
  org_id: string;
  project_id: string | null;
  location_id: string | null;
  name: string;
  kind: VenueKind;
  cluster: string | null;
  capacity: number | null;
  handover_state: HandoverState;
  metadata: unknown;
  created_at: string;
  updated_at: string;
};
export type VenueZone = {
  id: string;
  org_id: string;
  venue_id: string;
  code: string;
  name: string;
  parent_zone_id: string | null;
  allowed_categories: unknown;
  created_at: string;
};
export type VenueCertification = {
  id: string;
  org_id: string;
  venue_id: string;
  issuer: string;
  certificate: string;
  issued_on: string | null;
  expires_on: string | null;
  file_path: string | null;
  created_at: string;
};
export type AccreditationCategory = {
  id: string;
  org_id: string;
  code: string;
  name: string;
  color: string | null;
  description: string | null;
  zone_privileges: unknown;
  created_at: string;
  updated_at: string;
};
export type Accreditation = {
  id: string;
  org_id: string;
  person_name: string;
  person_email: string | null;
  user_id: string | null;
  delegation_id: string | null;
  category_id: string | null;
  state: AccreditationState;
  vetting: VettingState;
  card_barcode: string | null;
  valid_from: string | null;
  valid_to: string | null;
  issued_at: string | null;
  revoked_at: string | null;
  revoke_reason: string | null;
  photo_path: string | null;
  metadata: unknown;
  created_at: string;
  updated_at: string;
};
export type AccessScan = {
  id: string;
  org_id: string;
  accreditation_id: string | null;
  venue_id: string | null;
  zone_id: string | null;
  gate_code: string | null;
  result: string;
  reason: string | null;
  scanned_by: string | null;
  scanned_at: string;
  device_id: string | null;
};
export type AccreditationChange = {
  id: string;
  org_id: string;
  accreditation_id: string;
  kind: string;
  requested_by: string | null;
  status: string;
  decided_by: string | null;
  decided_at: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};
export type WorkforceMember = {
  id: string;
  org_id: string;
  user_id: string | null;
  kind: WorkforceKind;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  skills: unknown;
  venue_id: string | null;
  metadata: unknown;
  created_at: string;
  updated_at: string;
};
export type Roster = {
  id: string;
  org_id: string;
  venue_id: string | null;
  name: string;
  day_of: string;
  state: RosterState;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};
export type Shift = {
  id: string;
  org_id: string;
  roster_id: string | null;
  workforce_member_id: string | null;
  venue_id: string | null;
  zone_id: string | null;
  starts_at: string;
  ends_at: string;
  role: string | null;
  attendance: ShiftAttendance;
  checked_in_at: string | null;
  checked_out_at: string | null;
  break_minutes: number;
  meal_credit: boolean;
  created_at: string;
};
export type WorkforceDeployment = {
  id: string;
  org_id: string;
  venue_id: string;
  zone_id: string | null;
  shift_window: unknown;
  planned_fte: number;
  actual_fte: number;
  functional_area: string | null;
  created_at: string;
  updated_at: string;
};
export type Incident = {
  id: string;
  org_id: string;
  project_id: string | null;
  reporter_id: string;
  occurred_at: string;
  location: string | null;
  summary: string;
  description: string | null;
  severity: string;
  status: string;
  photos: unknown;
  ai_summary: string | null;
  created_at: string;
  updated_at: string;
};
export type Threat = {
  id: string;
  org_id: string;
  code: string;
  title: string;
  description: string | null;
  severity: "low" | "medium" | "high" | "critical";
  likelihood: "rare" | "unlikely" | "possible" | "likely" | "almost_certain";
  treatment: "mitigate" | "accept" | "transfer" | "avoid";
  classification: string;
  owner_id: string | null;
  status: "draft" | "active" | "closed" | "superseded";
  active: boolean;
  created_at: string;
  updated_at: string;
};
export type Playbook = {
  id: string;
  org_id: string;
  slug: string;
  title: string;
  summary: string | null;
  kind: string;
  content: unknown;
  version: number;
  status: "draft" | "published" | "archived";
  owner_id: string | null;
  created_at: string;
  updated_at: string;
};
export type GuardTour = {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  venue_id: string | null;
  route: unknown;
  cadence_minutes: number | null;
  next_run_at: string | null;
  status: "scheduled" | "in_progress" | "completed" | "cancelled" | "overdue";
  guard_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
export type Campaign = {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  channel: string;
  kind: string;
  status: "draft" | "scheduled" | "live" | "paused" | "complete" | "cancelled";
  starts_on: string | null;
  ends_on: string | null;
  budget_cents: number;
  spent_cents: number;
  owner_id: string | null;
  metadata: unknown;
  created_at: string;
  updated_at: string;
};
export type ServiceRequest = {
  id: string;
  org_id: string;
  project_id: string | null;
  venue_id: string | null;
  zone_id: string | null;
  category: "AV" | "cleaning" | "repair" | "IT" | "hospitality" | "security" | "other";
  severity: "P1" | "P2" | "P3" | "P4";
  summary: string;
  description: string | null;
  photos: unknown;
  requester_id: string | null;
  requester_email: string | null;
  requester_name: string | null;
  assigned_to: string | null;
  status: "open" | "acknowledged" | "in_progress" | "resolved" | "cancelled";
  opened_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  cancelled_at: string | null;
  sla_response_due: string | null;
  sla_resolution_due: string | null;
  sla_response_breached: boolean;
  sla_resolution_breached: boolean;
  resolution_note: string | null;
  metadata: unknown;
  created_at: string;
  updated_at: string;
};
export type ServiceSlaPolicy = {
  id: string;
  org_id: string;
  severity: "P1" | "P2" | "P3" | "P4";
  response_minutes: number;
  resolution_minutes: number;
  business_hours_only: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
};
export type ServiceRequestEvent = {
  id: string;
  request_id: string;
  org_id: string;
  actor_id: string | null;
  kind: "opened" | "acknowledged" | "assigned" | "status_changed" | "note" | "resolved" | "cancelled" | "sla_breached";
  payload: unknown;
  occurred_at: string;
};
export type MaintenanceSchedule = {
  id: string;
  org_id: string;
  name: string;
  kind: "inspection" | "service" | "cert_renewal" | "compliance";
  cadence_days: number;
  target_kind: "venue" | "equipment" | "credential" | "workforce" | "custom";
  target_id: string | null;
  owner_id: string | null;
  last_run_at: string | null;
  next_run_at: string | null;
  active: boolean;
  metadata: unknown;
  created_at: string;
  updated_at: string;
};
export type MaintenanceJob = {
  id: string;
  org_id: string;
  schedule_id: string | null;
  kind: "inspection" | "service" | "cert_renewal" | "compliance";
  target_kind: "venue" | "equipment" | "credential" | "workforce" | "custom";
  target_id: string | null;
  due_at: string;
  completed_at: string | null;
  completed_by: string | null;
  outcome: "pass" | "fail" | "partial" | null;
  notes: string | null;
  photos: unknown;
  created_at: string;
  updated_at: string;
};
export type MajorIncident = {
  id: string;
  org_id: string;
  incident_id: string | null;
  name: string;
  opened_at: string;
  closed_at: string | null;
  ics_roles: unknown;
  timeline: unknown;
  status: string;
  created_at: string;
  updated_at: string;
};
export type SafeguardingReport = {
  id: string;
  org_id: string;
  reporter_id: string | null;
  subject_ref: string | null;
  narrative: string;
  evidence_paths: unknown;
  status: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
};
export type MedicalEncounter = {
  id: string;
  org_id: string;
  incident_id: string | null;
  venue_id: string | null;
  patient_ref: string | null;
  triage: string | null;
  chief_complaint: string | null;
  disposition: string | null;
  clinician_id: string | null;
  phi_encrypted: unknown;
  created_at: string;
  updated_at: string;
};
export type EnvironmentalEvent = {
  id: string;
  org_id: string;
  venue_id: string | null;
  kind: string;
  severity: string;
  reading: unknown;
  started_at: string;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
};
export type CrisisAlert = {
  id: string;
  org_id: string;
  title: string;
  body: string;
  severity: string;
  channels: unknown;
  audience: unknown;
  scheduled_at: string | null;
  sent_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
export type CrisisAlertReceipt = {
  id: string;
  org_id: string;
  alert_id: string;
  user_id: string;
  delivered_at: string | null;
  acknowledged_at: string | null;
  channel: string | null;
};
export type Delegation = {
  id: string;
  org_id: string;
  code: string;
  name: string;
  country: string | null;
  attache_user_id: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  metadata: unknown;
  created_at: string;
  updated_at: string;
};
export type DelegationEntry = {
  id: string;
  org_id: string;
  delegation_id: string;
  discipline: string | null;
  event: string | null;
  participant_name: string;
  status: string;
  created_at: string;
  updated_at: string;
};
export type VisaCase = {
  id: string;
  org_id: string;
  delegation_id: string | null;
  person_name: string;
  nationality: string | null;
  passport_no: string | null;
  status: string;
  letter_path: string | null;
  created_at: string;
  updated_at: string;
};
export type RateCardItem = {
  id: string;
  org_id: string;
  catalog: string;
  sku: string;
  name: string;
  description: string | null;
  unit_price_cents: number;
  currency: string;
  metadata: unknown;
  active: boolean;
  created_at: string;
  updated_at: string;
};
export type RateCardOrder = {
  id: string;
  org_id: string;
  catalog: string;
  delegation_id: string | null;
  requester_id: string | null;
  status: string;
  total_cents: number;
  currency: string;
  line_items: unknown;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
export type DispatchRun = {
  id: string;
  org_id: string;
  fleet: DispatchFleet;
  vehicle_ref: string | null;
  driver_id: string | null;
  origin_venue_id: string | null;
  destination_venue_id: string | null;
  scheduled_depart: string;
  scheduled_arrive: string | null;
  actual_depart: string | null;
  actual_arrive: string | null;
  manifest: unknown;
  status: string;
  created_at: string;
  updated_at: string;
};
export type AdManifest = {
  id: string;
  org_id: string;
  kind: string;
  flight_ref: string | null;
  carrier: string | null;
  scheduled_at: string | null;
  actual_at: string | null;
  party_size: number;
  delegation_id: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};
export type AccommodationBlock = {
  id: string;
  org_id: string;
  name: string;
  property: string;
  city: string | null;
  stakeholder_group: string | null;
  rooms_reserved: number;
  rooms_confirmed: number;
  starts_on: string | null;
  ends_on: string | null;
  contract_path: string | null;
  created_at: string;
  updated_at: string;
};
export type SponsorEntitlement = {
  id: string;
  org_id: string;
  sponsor_client_id: string | null;
  title: string;
  quantity: number;
  delivered: number;
  status: string;
  due_by: string | null;
  evidence_path: string | null;
  created_at: string;
  updated_at: string;
};
export type DsarRequest = {
  id: string;
  org_id: string;
  requester_user_id: string | null;
  requester_email: string;
  kind: DsarKind;
  status: DsarStatus;
  identity_verified: boolean;
  due_by: string | null;
  fulfilled_at: string | null;
  payload_path: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
export type ConsentRecord = {
  id: string;
  org_id: string;
  user_id: string | null;
  purpose: string;
  granted: boolean;
  version: string | null;
  granted_at: string | null;
  revoked_at: string | null;
};
export type Trademark = {
  id: string;
  org_id: string;
  mark: string;
  jurisdiction: string | null;
  registration_no: string | null;
  registered_on: string | null;
  expires_on: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};
export type InsurancePolicy = {
  id: string;
  org_id: string;
  carrier: string;
  policy_no: string;
  kind: string;
  effective_on: string | null;
  expires_on: string | null;
  limits: unknown;
  document_path: string | null;
  created_at: string;
  updated_at: string;
};
export type IntegrationConnector = {
  id: string;
  org_id: string;
  slug: string;
  name: string;
  kind: string;
  enabled: boolean;
  config: unknown;
  secret_ref: string | null;
  created_at: string;
  updated_at: string;
};
export type SustainabilityMetric = {
  id: string;
  org_id: string;
  period_start: string;
  period_end: string;
  scope: number;
  kg_co2e: number;
  source: string | null;
  method: string | null;
  created_at: string;
  updated_at: string;
};
export type KbArticle = {
  id: string;
  org_id: string;
  slug: string;
  title: string;
  body_markdown: string;
  tags: unknown;
  author_id: string | null;
  version: number;
  created_at: string;
  updated_at: string;
};

// ── 2026-04-25 automations + form definitions ──────────────────────────
export type Automation = {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  trigger_kind: "manual" | "schedule" | "webhook" | "event";
  trigger_config: Record<string, unknown>;
  steps: unknown;
  enabled: boolean;
  last_run_at: string | null;
  last_run_status: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
export type FormDef = {
  id: string;
  org_id: string;
  slug: string;
  title: string;
  description: string | null;
  schema: Record<string, unknown>;
  status: "draft" | "published" | "archived";
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

// ── 2026-04-25 procurement RFQs ─────────────────────────────────────────
export type Rfq = {
  id: string;
  org_id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  status: "draft" | "sent" | "closed" | "awarded" | "cancelled";
  due_at: string | null;
  awarded_to_vendor_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

// ── 2026-04-25 run-of-show cues ─────────────────────────────────────────
export type Cue = {
  id: string;
  org_id: string;
  event_id: string | null;
  scheduled_at: string;
  lane: "show" | "lights" | "audio" | "video" | "talent" | "safety" | "transport";
  label: string;
  description: string | null;
  status: "pending" | "standby" | "live" | "done" | "skipped";
  owner_id: string | null;
  duration_seconds: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

// ── 2026-04-25 settings completion row types ─────────────────────────────
export type ApiKey = {
  id: string;
  org_id: string;
  name: string;
  prefix: string;
  hashed_secret: string;
  scopes: string[];
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_by: string | null;
  created_at: string;
};
export type OrgDomain = {
  id: string;
  org_id: string;
  hostname: string;
  purpose: string;
  verification_method: string;
  verification_token: string;
  verified_at: string | null;
  created_at: string;
};
export type OrgIntegration = {
  id: string;
  org_id: string;
  connector: string;
  status: string;
  config: Record<string, unknown>;
  installed_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};
export type ImportRun = {
  id: string;
  org_id: string;
  kind: string;
  source: string;
  filename: string | null;
  rows_total: number;
  rows_imported: number;
  rows_failed: number;
  status: string;
  error: string | null;
  log: unknown;
  created_by: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
};
export type GovernanceCommittee = {
  id: string;
  org_id: string;
  name: string;
  charter: string | null;
  cadence: string | null;
  chair_user_id: string | null;
  members: unknown;
  created_at: string;
};
export type GovernancePolicy = {
  id: string;
  org_id: string;
  name: string;
  category: string | null;
  body: string | null;
  effective_at: string | null;
  reviewed_at: string | null;
  next_review_at: string | null;
  status: string;
  owner_user_id: string | null;
  created_at: string;
};
export type OrgRole = {
  id: string;
  org_id: string;
  slug: string;
  label: string;
  description: string | null;
  permissions: string[];
  is_system: boolean;
  created_at: string;
};
// ── 2026-04-30 procore parity ─────────────────────────────────────
export type Conversation = {
  id: string;
  org_id: string;
  record_type: string;
  record_id: string;
  created_at: string;
};
export type ConversationMessage = {
  id: string;
  org_id: string;
  conversation_id: string;
  author_id: string | null;
  body: string;
  attachments: unknown;
  created_at: string;
};
export type DailyLog = {
  id: string;
  org_id: string;
  project_id: string;
  log_date: string;
  weather_summary: string | null;
  weather_temp_high_f: number | null;
  weather_temp_low_f: number | null;
  weather_precip_in: number | null;
  weather_wind_mph: number | null;
  weather_source: string | null;
  notes: string | null;
  status: "draft" | "submitted" | "approved";
  submitted_by: string | null;
  submitted_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
export type DailyLogManpower = {
  id: string;
  org_id: string;
  daily_log_id: string;
  trade: string;
  vendor_id: string | null;
  headcount: number;
  hours_worked: number;
  notes: string | null;
  created_at: string;
};
export type DailyLogEquipment = {
  id: string;
  org_id: string;
  daily_log_id: string;
  equipment_id: string | null;
  description: string | null;
  hours_used: number;
  hours_idle: number;
  notes: string | null;
  created_at: string;
};
export type DailyLogDelivery = {
  id: string;
  org_id: string;
  daily_log_id: string;
  vendor_id: string | null;
  description: string;
  arrived_at: string | null;
  received_by: string | null;
  notes: string | null;
  created_at: string;
};
export type DailyLogVisitor = {
  id: string;
  org_id: string;
  daily_log_id: string;
  name: string;
  organization: string | null;
  purpose: string | null;
  arrived_at: string | null;
  departed_at: string | null;
  created_at: string;
};
export type DailyLogPhoto = {
  id: string;
  org_id: string;
  daily_log_id: string;
  file_path: string;
  caption: string | null;
  taken_at: string;
  taken_by: string | null;
  created_at: string;
};
export type SitePlan = {
  id: string;
  org_id: string;
  project_id: string | null;
  venue_id: string | null;
  code: string;
  title: string;
  discipline:
    | "site"
    | "rigging"
    | "power"
    | "audio"
    | "video"
    | "lighting"
    | "comms"
    | "evacuation"
    | "hospitality"
    | "accessibility"
    | "sustainability"
    | "other";
  current_revision_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
export type SitePlanRevision = {
  id: string;
  org_id: string;
  site_plan_id: string;
  revision_label: string;
  file_path: string;
  notes: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
  created_at: string;
};
export type SitePlanPin = {
  id: string;
  org_id: string;
  site_plan_id: string;
  x_pct: number;
  y_pct: number;
  pin_type: "issue" | "note" | "rfi" | "punch" | "inspection" | "rigging" | "power" | "equipment" | "zone";
  link_record_type: string | null;
  link_record_id: string | null;
  label: string | null;
  created_by: string | null;
  created_at: string;
};
export type InspectionTemplate = {
  id: string;
  org_id: string;
  code: string;
  name: string;
  category:
    | "rigging"
    | "fire"
    | "electrical"
    | "ada"
    | "food_safety"
    | "security"
    | "foh"
    | "medical"
    | "sustainability"
    | "custom";
  description: string | null;
  active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
export type InspectionTemplateItem = {
  id: string;
  org_id: string;
  template_id: string;
  position: number;
  prompt: string;
  requires_photo: boolean;
  requires_note_on_fail: boolean;
  created_at: string;
};
export type Inspection = {
  id: string;
  org_id: string;
  project_id: string | null;
  template_id: string | null;
  code: string;
  name: string;
  category: string | null;
  status: "scheduled" | "in_progress" | "passed" | "failed" | "cancelled";
  inspector_id: string | null;
  scheduled_for: string | null;
  started_at: string | null;
  completed_at: string | null;
  signature_path: string | null;
  signed_at: string | null;
  signed_by: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
export type InspectionItem = {
  id: string;
  org_id: string;
  inspection_id: string;
  template_item_id: string | null;
  position: number;
  prompt: string;
  result: "pending" | "pass" | "fail" | "na";
  photo_path: string | null;
  notes: string | null;
  created_at: string;
};
export type Rfi = {
  id: string;
  org_id: string;
  project_id: string;
  code: string;
  subject: string;
  question: string;
  category: string | null;
  asked_by: string | null;
  ball_in_court_id: string | null;
  status: "open" | "answered" | "closed" | "void";
  priority: "low" | "normal" | "high" | "urgent";
  due_at: string | null;
  asked_at: string;
  answered_at: string | null;
  closed_at: string | null;
  official_answer: string | null;
  answered_by: string | null;
  linked_deliverable_id: string | null;
  linked_po_id: string | null;
  linked_site_plan_id: string | null;
  created_at: string;
  updated_at: string;
};
export type Submittal = {
  id: string;
  org_id: string;
  project_id: string;
  code: string;
  title: string;
  spec_section: string | null;
  vendor_id: string | null;
  ball_in_court_id: string | null;
  status:
    | "draft"
    | "submitted"
    | "in_review"
    | "approved"
    | "approved_with_comments"
    | "revise_resubmit"
    | "rejected"
    | "void"
    | "closed";
  current_round: number;
  due_at: string | null;
  submitted_at: string | null;
  closed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
export type SubmittalRevision = {
  id: string;
  org_id: string;
  submittal_id: string;
  round: number;
  file_path: string | null;
  submitted_by: string | null;
  submitted_at: string;
  stamp: "no_stamp" | "approved" | "approved_with_comments" | "revise_resubmit" | "rejected";
  stamp_notes: string | null;
  stamped_by: string | null;
  stamped_at: string | null;
  created_at: string;
};
export type PunchList = {
  id: string;
  org_id: string;
  project_id: string;
  name: string;
  category: string | null;
  status: "open" | "closed";
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
export type PunchItem = {
  id: string;
  org_id: string;
  project_id: string;
  punch_list_id: string | null;
  code: string;
  title: string;
  description: string | null;
  status: "open" | "in_progress" | "ready_for_review" | "complete" | "void";
  priority: "low" | "normal" | "high" | "urgent";
  assignee_id: string | null;
  vendor_id: string | null;
  due_at: string | null;
  closed_at: string | null;
  closed_by: string | null;
  site_plan_id: string | null;
  pin_x: number | null;
  pin_y: number | null;
  photo_path: string | null;
  show_ready_gate: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
export type PaymentApplication = {
  id: string;
  org_id: string;
  project_id: string;
  purchase_order_id: string;
  vendor_id: string | null;
  application_number: number;
  period_start: string;
  period_end: string;
  status: "draft" | "submitted" | "in_review" | "approved" | "rejected" | "paid";
  retention_pct: number;
  total_completed_cents: number;
  total_retention_cents: number;
  total_previously_paid_cents: number;
  total_due_cents: number;
  submitted_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  paid_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
export type PaymentApplicationLine = {
  id: string;
  org_id: string;
  payment_application_id: string;
  po_line_item_id: string;
  scheduled_value_cents: number;
  pct_complete_to_date: number;
  pct_complete_this_period: number;
  completed_to_date_cents: number;
  this_period_cents: number;
  retention_cents: number;
  notes: string | null;
  created_at: string;
};
export type PoChangeOrder = {
  id: string;
  org_id: string;
  project_id: string | null;
  purchase_order_id: string;
  number: number;
  title: string;
  description: string | null;
  reason: string | null;
  status: "proposed" | "submitted" | "in_review" | "approved" | "rejected" | "void";
  amount_cents: number;
  schedule_impact_days: number;
  proposed_at: string;
  approved_at: string | null;
  approved_by: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
export type PoChangeOrderLine = {
  id: string;
  org_id: string;
  po_change_order_id: string;
  description: string;
  quantity: number;
  unit_price_cents: number;
  position: number;
  created_at: string;
};
export type RfqResponseState = "invited" | "viewed" | "responded" | "no_bid" | "withdrawn" | "awarded" | "declined";

export type RfqResponse = {
  id: string;
  org_id: string;
  requisition_id: string;
  vendor_id: string | null;
  response_state: RfqResponseState;
  total_cents: number | null;
  notes: string | null;
  submitted_at: string | null;
  awarded_at: string | null;
  awarded_by: string | null;
  created_at: string;
  updated_at: string;
};
export type RfqResponseLine = {
  id: string;
  org_id: string;
  rfq_response_id: string;
  position: number;
  description: string;
  quantity: number;
  unit_price_cents: number;
  notes: string | null;
  created_at: string;
};
export type PrequalificationQuestionnaire = {
  id: string;
  org_id: string;
  code: string;
  name: string;
  description: string | null;
  active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
export type PrequalificationQuestion = {
  id: string;
  org_id: string;
  questionnaire_id: string;
  position: number;
  category: "insurance" | "safety" | "financial" | "references" | "licenses" | "experience" | "other";
  prompt: string;
  required: boolean;
  scoring_weight: number;
  created_at: string;
};
export type VendorPrequalification = {
  id: string;
  org_id: string;
  vendor_id: string;
  questionnaire_id: string;
  status: "invited" | "in_progress" | "submitted" | "approved" | "approved_conditional" | "rejected" | "expired";
  score: number | null;
  approved_at: string | null;
  approved_by: string | null;
  expires_at: string | null;
  notes: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};
export type VendorPrequalificationAnswer = {
  id: string;
  org_id: string;
  vendor_prequalification_id: string;
  question_id: string;
  answer: string | null;
  attachment_path: string | null;
  score: number | null;
  created_at: string;
};
export type SafetyBriefing = {
  id: string;
  org_id: string;
  project_id: string | null;
  shift_id: string | null;
  topic: string;
  briefer_id: string | null;
  scheduled_for: string;
  conducted_at: string | null;
  notes: string | null;
  attachment_path: string | null;
  status: "scheduled" | "conducted" | "cancelled";
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
export type SafetyBriefingAttendee = {
  id: string;
  org_id: string;
  briefing_id: string;
  user_id: string | null;
  crew_member_id: string | null;
  acknowledged_at: string | null;
  signature_path: string | null;
  notes: string | null;
  created_at: string;
};
export type ProjectPhoto = {
  id: string;
  org_id: string;
  project_id: string;
  album: string | null;
  file_path: string;
  caption: string | null;
  taken_at: string;
  taken_by: string | null;
  location_id: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
};
export type CostCode = {
  id: string;
  org_id: string;
  code: string;
  name: string;
  description: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};
export type WorkOrderBroadcast = {
  id: string;
  org_id: string;
  project_id: string | null;
  requisition_id: string | null;
  code: string;
  title: string;
  description: string | null;
  category: string | null;
  budget_cents: number | null;
  needed_by: string | null;
  status: "draft" | "open" | "closed" | "awarded" | "cancelled";
  awarded_to_vendor_id: string | null;
  awarded_at: string | null;
  awarded_by: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
export type WorkOrderBroadcastInvite = {
  id: string;
  org_id: string;
  broadcast_id: string;
  vendor_id: string;
  status: "invited" | "viewed" | "accepted" | "declined";
  responded_at: string | null;
  notes: string | null;
  created_at: string;
};
export type PoChecklistItem = {
  id: string;
  org_id: string;
  purchase_order_id: string;
  position: number;
  prompt: string;
  requires_photo: boolean;
  status: "pending" | "complete" | "skipped";
  completed_at: string | null;
  completed_by: string | null;
  photo_path: string | null;
  notes: string | null;
  created_at: string;
};
export type PunchPriority = "low" | "normal" | "high" | "urgent";

export type Database = {
  public: {
    Tables: {
      orgs: TableDef<Org, Omit<Org, "id" | "created_at"> & { id?: string; created_at?: string }, Partial<Org>>;
      users: TableDef<User, Omit<User, "created_at"> & { created_at?: string }, Partial<User>>;
      memberships: TableDef<
        Membership,
        Omit<Membership, "id" | "created_at" | "is_developer"> & {
          id?: string;
          created_at?: string;
          is_developer?: boolean;
        },
        Partial<Membership>
      >;
      project_members: TableDef<
        ProjectMember,
        Omit<ProjectMember, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        },
        Partial<ProjectMember>
      >;

      projects: TableDef<
        Project,
        {
          id?: string;
          org_id: string;
          slug: string;
          name: string;
          description?: string | null;
          status?: ProjectStatus;
          start_date?: string | null;
          end_date?: string | null;
          client_id?: string | null;
          budget_cents?: number | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        },
        Partial<Project>
      >;

      deliverables: TableDef<
        Deliverable,
        {
          id?: string;
          org_id: string;
          project_id: string;
          type: DeliverableType;
          title?: string | null;
          fulfillment_state?: FulfillmentState;
          data?: unknown;
          file_path?: string | null;
          version?: number;
          submitted_by?: string | null;
          reviewed_by?: string | null;
          submitted_at?: string | null;
          reviewed_at?: string | null;
          deadline?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        Partial<Deliverable>
      >;
      deliverable_comments: TableDef<
        DeliverableComment,
        { id?: string; deliverable_id: string; user_id: string; body: string; created_at?: string },
        Partial<DeliverableComment>
      >;

      clients: TableDef<
        Client,
        {
          id?: string;
          org_id: string;
          name: string;
          contact_email?: string | null;
          contact_phone?: string | null;
          website?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        },
        Partial<Client>
      >;
      leads: TableDef<
        Lead,
        {
          id?: string;
          org_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          source?: string | null;
          stage?: LeadStage;
          estimated_value_cents?: number | null;
          assigned_to?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        Partial<Lead>
      >;
      proposals: TableDef<
        Proposal,
        {
          id?: string;
          org_id: string;
          project_id?: string | null;
          client_id?: string | null;
          title: string;
          amount_cents?: number | null;
          status?: ProposalStatus;
          sent_at?: string | null;
          signed_at?: string | null;
          expires_at?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          doc_number?: string | null;
          version?: number;
          theme?: { primary: string; secondary: string };
          blocks?: unknown;
          signer_name?: string | null;
          signer_email?: string | null;
          signature_hash?: string | null;
          signature_data?: string | null;
          deposit_percent?: number;
          currency?: string;
        },
        Partial<Proposal>
      >;
      proposal_share_links: TableDef<
        ProposalShareLink,
        {
          id?: string;
          proposal_id: string;
          token: string;
          audience?: string | null;
          created_by?: string | null;
          expires_at?: string | null;
          last_viewed_at?: string | null;
          view_count?: number;
          revoked_at?: string | null;
          created_at?: string;
        },
        Partial<ProposalShareLink>
      >;
      proposal_signatures: TableDef<
        ProposalSignature,
        {
          id?: string;
          proposal_id: string;
          share_token?: string | null;
          signer_name: string;
          signer_email?: string | null;
          signer_ip?: string | null;
          signer_role?: string | null;
          signature_kind: "typed" | "canvas";
          signature_hash: string;
          signature_data?: string | null;
          signed_at?: string;
        },
        Partial<ProposalSignature>
      >;
      proposal_events: TableDef<
        {
          id: string;
          proposal_id: string;
          share_token: string | null;
          event_type: string;
          metadata: unknown;
          at: string;
        },
        {
          id?: string;
          proposal_id: string;
          share_token?: string | null;
          event_type: string;
          metadata?: unknown;
          at?: string;
        },
        Partial<{
          id: string;
          proposal_id: string;
          share_token: string | null;
          event_type: string;
          metadata: unknown;
          at: string;
        }>
      >;
      proposal_versions: TableDef<
        {
          id: string;
          proposal_id: string;
          version: number;
          blocks: unknown;
          theme: unknown;
          changed_by: string | null;
          changed_at: string;
        },
        {
          id?: string;
          proposal_id: string;
          version: number;
          blocks: unknown;
          theme?: unknown;
          changed_by?: string | null;
          changed_at?: string;
        },
        Partial<{
          id: string;
          proposal_id: string;
          version: number;
          blocks: unknown;
          theme: unknown;
          changed_by: string | null;
          changed_at: string;
        }>
      >;

      invoices: TableDef<
        Invoice,
        {
          id?: string;
          org_id: string;
          project_id?: string | null;
          client_id?: string | null;
          number: string;
          title: string;
          amount_cents?: number;
          currency?: string;
          status?: InvoiceStatus;
          issued_at?: string | null;
          due_at?: string | null;
          paid_at?: string | null;
          stripe_payment_intent?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        Partial<Invoice>
      >;
      invoice_line_items: TableDef<
        InvoiceLineItem,
        {
          id?: string;
          invoice_id: string;
          description: string;
          quantity?: number;
          unit_price_cents?: number;
          position?: number;
        },
        Partial<InvoiceLineItem>
      >;
      expenses: TableDef<
        Expense,
        {
          id?: string;
          org_id: string;
          project_id?: string | null;
          submitter_id: string;
          category?: string | null;
          description: string;
          amount_cents: number;
          currency?: string;
          status?: ExpenseStatus;
          receipt_path?: string | null;
          spent_at: string;
          created_at?: string;
          updated_at?: string;
        },
        Partial<Expense>
      >;
      budgets: TableDef<
        Budget,
        {
          id?: string;
          org_id: string;
          project_id?: string | null;
          name: string;
          category?: string | null;
          amount_cents?: number;
          spent_cents?: number;
          created_at?: string;
        },
        Partial<Budget>
      >;
      time_entries: TableDef<
        TimeEntry,
        {
          id?: string;
          org_id: string;
          project_id?: string | null;
          user_id: string;
          description?: string | null;
          started_at: string;
          ended_at?: string | null;
          duration_minutes?: number | null;
          billable?: boolean;
          created_at?: string;
        },
        Partial<TimeEntry>
      >;
      mileage_logs: TableDef<
        MileageLog,
        {
          id?: string;
          org_id: string;
          project_id?: string | null;
          user_id: string;
          origin: string;
          destination: string;
          miles: number;
          rate_cents?: number;
          logged_on: string;
          notes?: string | null;
          created_at?: string;
        },
        Partial<MileageLog>
      >;
      vendors: TableDef<
        Vendor,
        {
          id?: string;
          org_id: string;
          name: string;
          contact_email?: string | null;
          contact_phone?: string | null;
          category?: string | null;
          w9_on_file?: boolean;
          coi_expires_at?: string | null;
          payout_account_id?: string | null;
          notes?: string | null;
          created_at?: string;
        },
        Partial<Vendor>
      >;
      requisitions: TableDef<
        Requisition,
        {
          id?: string;
          org_id: string;
          project_id?: string | null;
          requester_id: string;
          title: string;
          description?: string | null;
          estimated_cents?: number | null;
          status?: ReqStatus;
          created_at?: string;
        },
        Partial<Requisition>
      >;
      purchase_orders: TableDef<
        PurchaseOrder,
        {
          id?: string;
          org_id: string;
          project_id?: string | null;
          vendor_id?: string | null;
          requisition_id?: string | null;
          number: string;
          title: string;
          amount_cents?: number;
          currency?: string;
          status?: POStatus;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        Partial<PurchaseOrder>
      >;
      po_line_items: TableDef<
        POLineItem,
        {
          id?: string;
          purchase_order_id: string;
          description: string;
          quantity?: number;
          unit_price_cents?: number;
          position?: number;
        },
        Partial<POLineItem>
      >;

      equipment: TableDef<
        Equipment,
        {
          id?: string;
          org_id: string;
          name: string;
          category?: string | null;
          asset_tag?: string | null;
          serial?: string | null;
          status?: EquipmentStatus;
          location_id?: string | null;
          daily_rate_cents?: number | null;
          notes?: string | null;
          created_at?: string;
        },
        Partial<Equipment>
      >;
      rentals: TableDef<
        Rental,
        {
          id?: string;
          org_id: string;
          project_id?: string | null;
          equipment_id: string;
          starts_at: string;
          ends_at: string;
          rate_cents?: number | null;
          notes?: string | null;
          created_at?: string;
        },
        Partial<Rental>
      >;
      fabrication_orders: TableDef<
        FabricationOrder,
        {
          id?: string;
          org_id: string;
          project_id?: string | null;
          title: string;
          description?: string | null;
          due_at?: string | null;
          status?: FabricationStatus;
          created_at?: string;
        },
        Partial<FabricationOrder>
      >;

      tasks: TableDef<
        Task,
        {
          id?: string;
          org_id: string;
          project_id?: string | null;
          title: string;
          description?: string | null;
          status?: TaskStatus;
          priority?: number;
          due_at?: string | null;
          assigned_to?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        Partial<Task>
      >;
      events: TableDef<
        EventRow,
        {
          id?: string;
          org_id: string;
          project_id?: string | null;
          name: string;
          starts_at: string;
          ends_at: string;
          location_id?: string | null;
          status?: EventStatus;
          description?: string | null;
          created_at?: string;
        },
        Partial<EventRow>
      >;
      locations: TableDef<
        Location,
        {
          id?: string;
          org_id: string;
          name: string;
          address?: string | null;
          city?: string | null;
          region?: string | null;
          country?: string | null;
          postcode?: string | null;
          lat?: number | null;
          lng?: number | null;
          notes?: string | null;
          created_at?: string;
        },
        Partial<Location>
      >;
      crew_members: TableDef<
        CrewMember,
        {
          id?: string;
          org_id: string;
          user_id?: string | null;
          name: string;
          role?: string | null;
          phone?: string | null;
          email?: string | null;
          day_rate_cents?: number | null;
          notes?: string | null;
          created_at?: string;
        },
        Partial<CrewMember>
      >;
      credentials: TableDef<
        Credential,
        {
          id?: string;
          org_id: string;
          crew_member_id?: string | null;
          kind: string;
          number?: string | null;
          issued_on?: string | null;
          expires_on?: string | null;
          file_path?: string | null;
          created_at?: string;
        },
        Partial<Credential>
      >;

      ai_conversations: TableDef<
        AIConversation,
        { id?: string; org_id: string; user_id: string; title?: string; created_at?: string },
        Partial<AIConversation>
      >;
      ai_messages: TableDef<
        AIMessage,
        { id?: string; conversation_id: string; role: AIMessage["role"]; content: string; created_at?: string },
        Partial<AIMessage>
      >;
      audit_log: TableDef<
        AuditLog,
        {
          id?: string;
          org_id: string;
          actor_id?: string | null;
          action: string;
          target_table?: string | null;
          target_id?: string | null;
          metadata?: unknown;
          at?: string;
        },
        Partial<AuditLog>
      >;
      notifications: TableDef<
        Notification,
        {
          id?: string;
          org_id: string;
          user_id: string;
          title: string;
          body?: string | null;
          href?: string | null;
          read_at?: string | null;
          created_at?: string;
        },
        Partial<Notification>
      >;
      event_guides: TableDef<
        EventGuide,
        {
          id?: string;
          org_id: string;
          project_id: string;
          persona: GuidePersona;
          tier?: number;
          classification?: string | null;
          slug?: string | null;
          title: string;
          subtitle?: string | null;
          published?: boolean;
          config?: unknown;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        Partial<EventGuide>
      >;

      // ═══ Olympic-scope (migration 0030) ════════════════════════════════
      risks: TableDef<Risk, Partial<Risk> & { org_id: string; title: string }, Partial<Risk>>;
      program_reviews: TableDef<
        ProgramReview,
        Partial<ProgramReview> & { org_id: string; title: string; scheduled_at: string },
        Partial<ProgramReview>
      >;
      readiness_exercises: TableDef<
        ReadinessExercise,
        Partial<ReadinessExercise> & { org_id: string; name: string },
        Partial<ReadinessExercise>
      >;
      venues: TableDef<Venue, Partial<Venue> & { org_id: string; name: string }, Partial<Venue>>;
      venue_zones: TableDef<
        VenueZone,
        Partial<VenueZone> & { org_id: string; venue_id: string; code: string; name: string },
        Partial<VenueZone>
      >;
      venue_certifications: TableDef<
        VenueCertification,
        Partial<VenueCertification> & { org_id: string; venue_id: string; issuer: string; certificate: string },
        Partial<VenueCertification>
      >;
      accreditation_categories: TableDef<
        AccreditationCategory,
        Partial<AccreditationCategory> & { org_id: string; code: string; name: string },
        Partial<AccreditationCategory>
      >;
      accreditations: TableDef<
        Accreditation,
        Partial<Accreditation> & { org_id: string; person_name: string },
        Partial<Accreditation>
      >;
      access_scans: TableDef<AccessScan, Partial<AccessScan> & { org_id: string; result: string }, Partial<AccessScan>>;
      accreditation_changes: TableDef<
        AccreditationChange,
        Partial<AccreditationChange> & { org_id: string; accreditation_id: string; kind: string },
        Partial<AccreditationChange>
      >;
      workforce_members: TableDef<
        WorkforceMember,
        Partial<WorkforceMember> & { org_id: string; full_name: string },
        Partial<WorkforceMember>
      >;
      rosters: TableDef<Roster, Partial<Roster> & { org_id: string; name: string; day_of: string }, Partial<Roster>>;
      shifts: TableDef<Shift, Partial<Shift> & { org_id: string; starts_at: string; ends_at: string }, Partial<Shift>>;
      workforce_deployments: TableDef<
        WorkforceDeployment,
        Partial<WorkforceDeployment> & { org_id: string; venue_id: string },
        Partial<WorkforceDeployment>
      >;
      incidents: TableDef<
        Incident,
        Partial<Incident> & {
          org_id: string;
          reporter_id: string;
          occurred_at: string;
          summary: string;
          severity: string;
        },
        Partial<Incident>
      >;
      major_incidents: TableDef<
        MajorIncident,
        Partial<MajorIncident> & { org_id: string; name: string },
        Partial<MajorIncident>
      >;
      service_requests: TableDef<
        ServiceRequest,
        Partial<ServiceRequest> & { org_id: string; category: ServiceRequest["category"]; summary: string },
        Partial<ServiceRequest>
      >;
      threats: TableDef<
        Threat,
        Partial<Threat> & { org_id: string; code: string; title: string; severity: string; likelihood: string },
        Partial<Threat>
      >;
      playbooks: TableDef<
        Playbook,
        Partial<Playbook> & { org_id: string; slug: string; title: string },
        Partial<Playbook>
      >;
      guard_tours: TableDef<GuardTour, Partial<GuardTour> & { org_id: string; name: string }, Partial<GuardTour>>;
      campaigns: TableDef<Campaign, Partial<Campaign> & { org_id: string; name: string }, Partial<Campaign>>;
      service_sla_policies: TableDef<
        ServiceSlaPolicy,
        Partial<ServiceSlaPolicy> & {
          org_id: string;
          severity: ServiceSlaPolicy["severity"];
          response_minutes: number;
          resolution_minutes: number;
        },
        Partial<ServiceSlaPolicy>
      >;
      service_request_events: TableDef<
        ServiceRequestEvent,
        Partial<ServiceRequestEvent> & { request_id: string; org_id: string; kind: ServiceRequestEvent["kind"] },
        Partial<ServiceRequestEvent>
      >;
      maintenance_schedules: TableDef<
        MaintenanceSchedule,
        Partial<MaintenanceSchedule> & {
          org_id: string;
          name: string;
          kind: MaintenanceSchedule["kind"];
          cadence_days: number;
          target_kind: MaintenanceSchedule["target_kind"];
        },
        Partial<MaintenanceSchedule>
      >;
      maintenance_jobs: TableDef<
        MaintenanceJob,
        Partial<MaintenanceJob> & {
          org_id: string;
          kind: MaintenanceJob["kind"];
          target_kind: MaintenanceJob["target_kind"];
          due_at: string;
        },
        Partial<MaintenanceJob>
      >;
      safeguarding_reports: TableDef<
        SafeguardingReport,
        Partial<SafeguardingReport> & { org_id: string; narrative: string },
        Partial<SafeguardingReport>
      >;
      medical_encounters: TableDef<
        MedicalEncounter,
        Partial<MedicalEncounter> & { org_id: string },
        Partial<MedicalEncounter>
      >;
      environmental_events: TableDef<
        EnvironmentalEvent,
        Partial<EnvironmentalEvent> & { org_id: string; kind: string; severity: string },
        Partial<EnvironmentalEvent>
      >;
      crisis_alerts: TableDef<
        CrisisAlert,
        Partial<CrisisAlert> & { org_id: string; title: string; body: string },
        Partial<CrisisAlert>
      >;
      crisis_alert_receipts: TableDef<
        CrisisAlertReceipt,
        Partial<CrisisAlertReceipt> & { org_id: string; alert_id: string; user_id: string },
        Partial<CrisisAlertReceipt>
      >;
      delegations: TableDef<
        Delegation,
        Partial<Delegation> & { org_id: string; code: string; name: string },
        Partial<Delegation>
      >;
      delegation_entries: TableDef<
        DelegationEntry,
        Partial<DelegationEntry> & { org_id: string; delegation_id: string; participant_name: string },
        Partial<DelegationEntry>
      >;
      visa_cases: TableDef<VisaCase, Partial<VisaCase> & { org_id: string; person_name: string }, Partial<VisaCase>>;
      rate_card_items: TableDef<
        RateCardItem,
        Partial<RateCardItem> & { org_id: string; sku: string; name: string },
        Partial<RateCardItem>
      >;
      rate_card_orders: TableDef<RateCardOrder, Partial<RateCardOrder> & { org_id: string }, Partial<RateCardOrder>>;
      dispatch_runs: TableDef<
        DispatchRun,
        Partial<DispatchRun> & { org_id: string; scheduled_depart: string },
        Partial<DispatchRun>
      >;
      ad_manifests: TableDef<AdManifest, Partial<AdManifest> & { org_id: string }, Partial<AdManifest>>;
      accommodation_blocks: TableDef<
        AccommodationBlock,
        Partial<AccommodationBlock> & { org_id: string; name: string; property: string },
        Partial<AccommodationBlock>
      >;
      sponsor_entitlements: TableDef<
        SponsorEntitlement,
        Partial<SponsorEntitlement> & { org_id: string; title: string },
        Partial<SponsorEntitlement>
      >;
      dsar_requests: TableDef<
        DsarRequest,
        Partial<DsarRequest> & { org_id: string; requester_email: string },
        Partial<DsarRequest>
      >;
      consent_records: TableDef<
        ConsentRecord,
        Partial<ConsentRecord> & { org_id: string; purpose: string },
        Partial<ConsentRecord>
      >;
      trademarks: TableDef<Trademark, Partial<Trademark> & { org_id: string; mark: string }, Partial<Trademark>>;
      insurance_policies: TableDef<
        InsurancePolicy,
        Partial<InsurancePolicy> & { org_id: string; carrier: string; policy_no: string; kind: string },
        Partial<InsurancePolicy>
      >;
      integration_connectors: TableDef<
        IntegrationConnector,
        Partial<IntegrationConnector> & { org_id: string; slug: string; name: string; kind: string },
        Partial<IntegrationConnector>
      >;
      sustainability_metrics: TableDef<
        SustainabilityMetric,
        Partial<SustainabilityMetric> & { org_id: string; period_start: string; period_end: string },
        Partial<SustainabilityMetric>
      >;
      kb_articles: TableDef<
        KbArticle,
        Partial<KbArticle> & { org_id: string; slug: string; title: string; body_markdown: string },
        Partial<KbArticle>
      >;
      // ── 2026-04-25 settings completion ────────────────────────────────
      api_keys: TableDef<
        ApiKey,
        Partial<ApiKey> & { org_id: string; name: string; prefix: string; hashed_secret: string },
        Partial<ApiKey>
      >;
      org_domains: TableDef<OrgDomain, Partial<OrgDomain> & { org_id: string; hostname: string }, Partial<OrgDomain>>;
      org_integrations: TableDef<
        OrgIntegration,
        Partial<OrgIntegration> & { org_id: string; connector: string },
        Partial<OrgIntegration>
      >;
      import_runs: TableDef<ImportRun, Partial<ImportRun> & { org_id: string; kind: string }, Partial<ImportRun>>;
      governance_committees: TableDef<
        GovernanceCommittee,
        Partial<GovernanceCommittee> & { org_id: string; name: string },
        Partial<GovernanceCommittee>
      >;
      governance_policies: TableDef<
        GovernancePolicy,
        Partial<GovernancePolicy> & { org_id: string; name: string },
        Partial<GovernancePolicy>
      >;
      org_roles: TableDef<
        OrgRole,
        Partial<OrgRole> & { org_id: string; slug: string; label: string },
        Partial<OrgRole>
      >;
      cues: TableDef<Cue, Partial<Cue> & { org_id: string; scheduled_at: string; label: string }, Partial<Cue>>;
      rfqs: TableDef<Rfq, Partial<Rfq> & { org_id: string; title: string }, Partial<Rfq>>;
      automations: TableDef<Automation, Partial<Automation> & { org_id: string; name: string }, Partial<Automation>>;
      form_defs: TableDef<
        FormDef,
        Partial<FormDef> & { org_id: string; slug: string; title: string },
        Partial<FormDef>
      >;
      // ── 2026-04-30 procore parity ────────────────────────────────────
      conversations: TableDef<
        Conversation,
        Partial<Conversation> & { org_id: string; record_type: string; record_id: string },
        Partial<Conversation>
      >;
      conversation_messages: TableDef<
        ConversationMessage,
        Partial<ConversationMessage> & { org_id: string; conversation_id: string; body: string },
        Partial<ConversationMessage>
      >;
      daily_logs: TableDef<
        DailyLog,
        Partial<DailyLog> & { org_id: string; project_id: string; log_date: string },
        Partial<DailyLog>
      >;
      daily_log_manpower: TableDef<
        DailyLogManpower,
        Partial<DailyLogManpower> & { org_id: string; daily_log_id: string; trade: string; headcount: number },
        Partial<DailyLogManpower>
      >;
      daily_log_equipment: TableDef<
        DailyLogEquipment,
        Partial<DailyLogEquipment> & { org_id: string; daily_log_id: string },
        Partial<DailyLogEquipment>
      >;
      daily_log_deliveries: TableDef<
        DailyLogDelivery,
        Partial<DailyLogDelivery> & { org_id: string; daily_log_id: string; description: string },
        Partial<DailyLogDelivery>
      >;
      daily_log_visitors: TableDef<
        DailyLogVisitor,
        Partial<DailyLogVisitor> & { org_id: string; daily_log_id: string; name: string },
        Partial<DailyLogVisitor>
      >;
      daily_log_photos: TableDef<
        DailyLogPhoto,
        Partial<DailyLogPhoto> & { org_id: string; daily_log_id: string; file_path: string },
        Partial<DailyLogPhoto>
      >;
      site_plans: TableDef<
        SitePlan,
        Partial<SitePlan> & { org_id: string; code: string; title: string },
        Partial<SitePlan>
      >;
      site_plan_revisions: TableDef<
        SitePlanRevision,
        Partial<SitePlanRevision> & { org_id: string; site_plan_id: string; revision_label: string; file_path: string },
        Partial<SitePlanRevision>
      >;
      site_plan_pins: TableDef<
        SitePlanPin,
        Partial<SitePlanPin> & { org_id: string; site_plan_id: string; x_pct: number; y_pct: number; pin_type: string },
        Partial<SitePlanPin>
      >;
      inspection_templates: TableDef<
        InspectionTemplate,
        Partial<InspectionTemplate> & { org_id: string; code: string; name: string },
        Partial<InspectionTemplate>
      >;
      inspection_template_items: TableDef<
        InspectionTemplateItem,
        Partial<InspectionTemplateItem> & { org_id: string; template_id: string; prompt: string },
        Partial<InspectionTemplateItem>
      >;
      inspections: TableDef<
        Inspection,
        Partial<Inspection> & { org_id: string; code: string; name: string },
        Partial<Inspection>
      >;
      inspection_items: TableDef<
        InspectionItem,
        Partial<InspectionItem> & { org_id: string; inspection_id: string; prompt: string },
        Partial<InspectionItem>
      >;
      rfis: TableDef<
        Rfi,
        Partial<Rfi> & { org_id: string; project_id: string; code: string; subject: string; question: string },
        Partial<Rfi>
      >;
      submittals: TableDef<
        Submittal,
        Partial<Submittal> & { org_id: string; project_id: string; code: string; title: string },
        Partial<Submittal>
      >;
      submittal_revisions: TableDef<
        SubmittalRevision,
        Partial<SubmittalRevision> & { org_id: string; submittal_id: string; round: number },
        Partial<SubmittalRevision>
      >;
      punch_lists: TableDef<
        PunchList,
        Partial<PunchList> & { org_id: string; project_id: string; name: string },
        Partial<PunchList>
      >;
      punch_items: TableDef<
        PunchItem,
        Partial<PunchItem> & { org_id: string; project_id: string; code: string; title: string },
        Partial<PunchItem>
      >;
      payment_applications: TableDef<
        PaymentApplication,
        Partial<PaymentApplication> & {
          org_id: string;
          project_id: string;
          purchase_order_id: string;
          application_number: number;
          period_start: string;
          period_end: string;
        },
        Partial<PaymentApplication>
      >;
      payment_application_lines: TableDef<
        PaymentApplicationLine,
        Partial<PaymentApplicationLine> & { org_id: string; payment_application_id: string; po_line_item_id: string },
        Partial<PaymentApplicationLine>
      >;
      po_change_orders: TableDef<
        PoChangeOrder,
        Partial<PoChangeOrder> & { org_id: string; purchase_order_id: string; number: number; title: string },
        Partial<PoChangeOrder>
      >;
      po_change_order_lines: TableDef<
        PoChangeOrderLine,
        Partial<PoChangeOrderLine> & { org_id: string; po_change_order_id: string; description: string },
        Partial<PoChangeOrderLine>
      >;
      rfq_responses: TableDef<
        RfqResponse,
        Partial<RfqResponse> & { org_id: string; requisition_id: string },
        Partial<RfqResponse>
      >;
      rfq_response_lines: TableDef<
        RfqResponseLine,
        Partial<RfqResponseLine> & { org_id: string; rfq_response_id: string; description: string },
        Partial<RfqResponseLine>
      >;
      prequalification_questionnaires: TableDef<
        PrequalificationQuestionnaire,
        Partial<PrequalificationQuestionnaire> & { org_id: string; code: string; name: string },
        Partial<PrequalificationQuestionnaire>
      >;
      prequalification_questions: TableDef<
        PrequalificationQuestion,
        Partial<PrequalificationQuestion> & { org_id: string; questionnaire_id: string; prompt: string },
        Partial<PrequalificationQuestion>
      >;
      vendor_prequalifications: TableDef<
        VendorPrequalification,
        Partial<VendorPrequalification> & { org_id: string; vendor_id: string; questionnaire_id: string },
        Partial<VendorPrequalification>
      >;
      vendor_prequalification_answers: TableDef<
        VendorPrequalificationAnswer,
        Partial<VendorPrequalificationAnswer> & {
          org_id: string;
          vendor_prequalification_id: string;
          question_id: string;
        },
        Partial<VendorPrequalificationAnswer>
      >;
      safety_briefings: TableDef<
        SafetyBriefing,
        Partial<SafetyBriefing> & { org_id: string; topic: string; scheduled_for: string },
        Partial<SafetyBriefing>
      >;
      safety_briefing_attendees: TableDef<
        SafetyBriefingAttendee,
        Partial<SafetyBriefingAttendee> & { org_id: string; briefing_id: string },
        Partial<SafetyBriefingAttendee>
      >;
      project_photos: TableDef<
        ProjectPhoto,
        Partial<ProjectPhoto> & { org_id: string; project_id: string; file_path: string },
        Partial<ProjectPhoto>
      >;
      cost_codes: TableDef<
        CostCode,
        Partial<CostCode> & { org_id: string; code: string; name: string },
        Partial<CostCode>
      >;
      work_order_broadcasts: TableDef<
        WorkOrderBroadcast,
        Partial<WorkOrderBroadcast> & { org_id: string; code: string; title: string },
        Partial<WorkOrderBroadcast>
      >;
      work_order_broadcast_invites: TableDef<
        WorkOrderBroadcastInvite,
        Partial<WorkOrderBroadcastInvite> & { org_id: string; broadcast_id: string; vendor_id: string },
        Partial<WorkOrderBroadcastInvite>
      >;
      po_checklist_items: TableDef<
        PoChecklistItem,
        Partial<PoChecklistItem> & { org_id: string; purchase_order_id: string; prompt: string },
        Partial<PoChecklistItem>
      >;
      annotations: TableDef<
        Annotation,
        {
          id?: string;
          org_id: string;
          project_id?: string | null;
          target_table: string;
          target_id: string;
          parent_id?: string | null;
          kind?: AnnotationKind;
          severity?: AnnotationSeverity;
          status?: AnnotationStatus;
          title?: string | null;
          body: string;
          tags?: string[];
          confirmation_required?: boolean;
          confirmed_by?: string | null;
          confirmed_at?: string | null;
          due_at?: string | null;
          assigned_to?: string | null;
          linked_task_id?: string | null;
          metadata?: Record<string, unknown>;
          created_by?: string | null;
          resolved_by?: string | null;
          resolved_at?: string | null;
          resolution_note?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        Partial<Annotation>
      >;
      annotation_watchers: TableDef<
        AnnotationWatcher,
        { annotation_id: string; user_id: string; created_at?: string },
        Partial<AnnotationWatcher>
      >;
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      platform_role: PlatformRole;
      project_role: ProjectRole;
      tier: Tier;
      project_status: ProjectStatus;
      fulfillment_state: FulfillmentState;
      deliverable_type: DeliverableType;
      lead_stage: LeadStage;
      proposal_status: ProposalStatus;
      invoice_status: InvoiceStatus;
      expense_status: ExpenseStatus;
      po_status: POStatus;
      req_status: ReqStatus;
      equipment_status: EquipmentStatus;
      task_status: TaskStatus;
      event_status: EventStatus;
      annotation_kind: AnnotationKind;
      annotation_severity: AnnotationSeverity;
      annotation_status: AnnotationStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
