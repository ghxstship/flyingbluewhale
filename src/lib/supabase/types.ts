export type PlatformRole =
  | "developer" | "owner" | "admin" | "controller" | "collaborator"
  | "contractor" | "crew" | "client" | "viewer" | "community";

export type ProjectRole = "creator" | "collaborator" | "viewer" | "vendor";
export type Tier = "access" | "core" | "professional" | "enterprise";

export type Persona =
  | "visitor" | "owner" | "admin" | "controller" | "project_manager"
  | "crew" | "client" | "vendor" | "artist" | "sponsor" | "guest" | "developer";

export type ProjectStatus = "draft" | "active" | "paused" | "archived" | "complete";
export type TicketStatus = "issued" | "transferred" | "scanned" | "voided";
export type DeliverableStatus = "draft" | "submitted" | "in_review" | "approved" | "rejected" | "revision_requested";
export type DeliverableType =
  | "technical_rider" | "hospitality_rider" | "input_list" | "stage_plot" | "crew_list" | "guest_list"
  | "equipment_pull_list" | "power_plan" | "rigging_plan" | "site_plan" | "build_schedule"
  | "vendor_package" | "safety_compliance" | "comms_plan" | "signage_grid" | "custom";
export type LeadStage = "new" | "qualified" | "contacted" | "proposal" | "won" | "lost";
export type ProposalStatus = "draft" | "sent" | "approved" | "rejected" | "expired" | "signed";
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "voided";
export type ExpenseStatus = "pending" | "approved" | "rejected" | "reimbursed";
export type POStatus = "draft" | "sent" | "acknowledged" | "fulfilled" | "cancelled";
export type ReqStatus = "draft" | "submitted" | "approved" | "rejected" | "converted";
export type EquipmentStatus = "available" | "reserved" | "in_use" | "maintenance" | "retired";
export type TaskStatus = "todo" | "in_progress" | "blocked" | "review" | "done";
export type EventStatus = "draft" | "scheduled" | "live" | "complete" | "cancelled";
export type AdvanceStatus = "pending" | "approved" | "rejected" | "paid";
export type FabricationStatus = "open" | "in_progress" | "blocked" | "complete";

type TableDef<R, I, U> = { Row: R; Insert: I; Update: U; Relationships: [] };

// Core entities
export type Org = { id: string; slug: string; name: string; tier: Tier; created_at: string };
export type User = { id: string; email: string; name: string | null; avatar_url: string | null; created_at: string };
export type Membership = { id: string; org_id: string; user_id: string; role: PlatformRole; created_at: string };

export type Project = {
  id: string; org_id: string; slug: string; name: string; description: string | null;
  status: ProjectStatus; start_date: string | null; end_date: string | null;
  client_id: string | null; budget_cents: number | null; created_by: string;
  created_at: string; updated_at: string;
};

export type Ticket = {
  id: string; org_id: string; project_id: string; code: string;
  holder_name: string | null; holder_email: string | null; tier: string; status: TicketStatus;
  issued_at: string; scanned_at: string | null; scanned_by: string | null;
};

export type Deliverable = {
  id: string; org_id: string; project_id: string; type: DeliverableType;
  title: string | null; status: DeliverableStatus; data: unknown;
  file_path: string | null; version: number;
  submitted_by: string | null; reviewed_by: string | null;
  submitted_at: string | null; reviewed_at: string | null; deadline: string | null;
  created_at: string; updated_at: string;
};
export type DeliverableComment = {
  id: string; deliverable_id: string; user_id: string; body: string; created_at: string;
};

// Sales / CRM
export type Client = {
  id: string; org_id: string; name: string;
  contact_email: string | null; contact_phone: string | null; website: string | null;
  notes: string | null; created_by: string | null; created_at: string;
};
export type Lead = {
  id: string; org_id: string; name: string; email: string | null; phone: string | null;
  source: string | null; stage: LeadStage; estimated_value_cents: number | null;
  assigned_to: string | null; notes: string | null; created_by: string | null;
  created_at: string; updated_at: string;
};
export type Proposal = {
  id: string; org_id: string; project_id: string | null; client_id: string | null;
  title: string; amount_cents: number | null; status: ProposalStatus;
  sent_at: string | null; signed_at: string | null; expires_at: string | null;
  notes: string | null; created_by: string | null; created_at: string; updated_at: string;
  doc_number: string | null; version: number;
  theme: { primary: string; secondary: string };
  blocks: unknown;
  signer_name: string | null; signer_email: string | null;
  signature_hash: string | null; signature_data: string | null;
  deposit_percent: number; currency: string;
};

export type ProposalShareLink = {
  id: string; proposal_id: string; token: string; audience: string | null;
  created_by: string | null; expires_at: string | null;
  last_viewed_at: string | null; view_count: number;
  revoked_at: string | null; created_at: string;
};

export type ProposalSignature = {
  id: string; proposal_id: string; share_token: string | null;
  signer_name: string; signer_email: string | null; signer_ip: string | null;
  signer_role: string | null; signature_kind: "typed" | "canvas";
  signature_hash: string; signature_data: string | null; signed_at: string;
};

// Finance
export type Invoice = {
  id: string; org_id: string; project_id: string | null; client_id: string | null;
  number: string; title: string; amount_cents: number; currency: string;
  status: InvoiceStatus; issued_at: string | null; due_at: string | null;
  paid_at: string | null; stripe_payment_intent: string | null;
  notes: string | null; created_by: string | null; created_at: string; updated_at: string;
};
export type InvoiceLineItem = {
  id: string; invoice_id: string; description: string;
  quantity: number; unit_price_cents: number; position: number;
};
export type Expense = {
  id: string; org_id: string; project_id: string | null; submitter_id: string;
  category: string | null; description: string; amount_cents: number; currency: string;
  status: ExpenseStatus; receipt_path: string | null; spent_at: string;
  created_at: string; updated_at: string;
};
export type Budget = {
  id: string; org_id: string; project_id: string | null; name: string;
  category: string | null; amount_cents: number; spent_cents: number; created_at: string;
};
export type TimeEntry = {
  id: string; org_id: string; project_id: string | null; user_id: string;
  description: string | null; started_at: string; ended_at: string | null;
  duration_minutes: number | null; billable: boolean; created_at: string;
};
export type MileageLog = {
  id: string; org_id: string; project_id: string | null; user_id: string;
  origin: string; destination: string; miles: number; rate_cents: number;
  logged_on: string; notes: string | null; created_at: string;
};
export type Advance = {
  id: string; org_id: string; project_id: string | null; requester_id: string;
  amount_cents: number; currency: string; reason: string | null; status: AdvanceStatus;
  requested_at: string; decided_at: string | null;
};

// Procurement
export type Vendor = {
  id: string; org_id: string; name: string;
  contact_email: string | null; contact_phone: string | null;
  category: string | null; w9_on_file: boolean; coi_expires_at: string | null;
  payout_account_id: string | null; notes: string | null; created_at: string;
};
export type Requisition = {
  id: string; org_id: string; project_id: string | null; requester_id: string;
  title: string; description: string | null; estimated_cents: number | null;
  status: ReqStatus; created_at: string;
};
export type PurchaseOrder = {
  id: string; org_id: string; project_id: string | null; vendor_id: string | null;
  requisition_id: string | null; number: string; title: string;
  amount_cents: number; currency: string; status: POStatus;
  created_by: string | null; created_at: string; updated_at: string;
};
export type POLineItem = {
  id: string; purchase_order_id: string; description: string;
  quantity: number; unit_price_cents: number; position: number;
};

// Production
export type Equipment = {
  id: string; org_id: string; name: string; category: string | null;
  asset_tag: string | null; serial: string | null; status: EquipmentStatus;
  location_id: string | null; daily_rate_cents: number | null;
  notes: string | null; created_at: string;
};
export type Rental = {
  id: string; org_id: string; project_id: string | null; equipment_id: string;
  starts_at: string; ends_at: string; rate_cents: number | null;
  notes: string | null; created_at: string;
};
export type FabricationOrder = {
  id: string; org_id: string; project_id: string | null; title: string;
  description: string | null; due_at: string | null; status: FabricationStatus;
  created_at: string;
};

// Ops
export type Task = {
  id: string; org_id: string; project_id: string | null; title: string;
  description: string | null; status: TaskStatus; priority: number;
  due_at: string | null; assigned_to: string | null; created_by: string | null;
  created_at: string; updated_at: string;
};
export type EventRow = {
  id: string; org_id: string; project_id: string | null; name: string;
  starts_at: string; ends_at: string; location_id: string | null; status: EventStatus;
  description: string | null; created_at: string;
};
export type Location = {
  id: string; org_id: string; name: string; address: string | null;
  city: string | null; region: string | null; country: string | null; postcode: string | null;
  lat: number | null; lng: number | null; notes: string | null; created_at: string;
};
export type CrewMember = {
  id: string; org_id: string; user_id: string | null; name: string;
  role: string | null; phone: string | null; email: string | null;
  day_rate_cents: number | null; notes: string | null; created_at: string;
};
export type Credential = {
  id: string; org_id: string; crew_member_id: string | null; kind: string;
  number: string | null; issued_on: string | null; expires_on: string | null;
  file_path: string | null; created_at: string;
};

// AI + system
export type AIConversation = { id: string; org_id: string; user_id: string; title: string; created_at: string };
export type AIMessage = { id: string; conversation_id: string; role: "user" | "assistant" | "system" | "tool"; content: string; created_at: string };
export type AuditLog = { id: string; org_id: string; actor_id: string | null; action: string; target_table: string | null; target_id: string | null; metadata: unknown; at: string };
export type Notification = { id: string; org_id: string; user_id: string; title: string; body: string | null; href: string | null; read_at: string | null; created_at: string };

export type GuidePersona = "artist" | "vendor" | "client" | "sponsor" | "guest" | "crew" | "staff" | "custom";
export type EventGuide = {
  id: string; org_id: string; project_id: string; persona: GuidePersona; tier: number;
  classification: string | null; slug: string | null; title: string; subtitle: string | null;
  published: boolean; config: unknown; created_by: string | null;
  created_at: string; updated_at: string;
};

// ═══ Olympic-scope row types (fbw_030) ════════════════════════════════════
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
  id: string; org_id: string; project_id: string | null; kind: RaidKind;
  title: string; description: string | null; category: string | null;
  likelihood: RiskLikelihood; impact: RiskImpact;
  inherent_score: number; residual_score: number | null;
  status: RiskStatus; owner_id: string | null; treatment: string | null;
  due_on: string | null; created_by: string | null;
  created_at: string; updated_at: string;
};
export type ProgramReview = {
  id: string; org_id: string; title: string; scheduled_at: string;
  attendees: unknown; agenda: unknown; actions: unknown; decisions: unknown;
  notes: string | null; created_by: string | null; created_at: string; updated_at: string;
};
export type ReadinessExercise = {
  id: string; org_id: string; project_id: string | null; name: string; kind: string;
  scheduled_at: string | null; scenario: unknown; injects: unknown; aar: unknown;
  created_at: string; updated_at: string;
};
export type Venue = {
  id: string; org_id: string; project_id: string | null; location_id: string | null;
  name: string; kind: VenueKind; cluster: string | null; capacity: number | null;
  handover_state: HandoverState; metadata: unknown; created_at: string; updated_at: string;
};
export type VenueZone = {
  id: string; org_id: string; venue_id: string; code: string; name: string;
  parent_zone_id: string | null; allowed_categories: unknown; created_at: string;
};
export type VenueCertification = {
  id: string; org_id: string; venue_id: string; issuer: string; certificate: string;
  issued_on: string | null; expires_on: string | null; file_path: string | null; created_at: string;
};
export type AccreditationCategory = {
  id: string; org_id: string; code: string; name: string;
  color: string | null; description: string | null; zone_privileges: unknown; created_at: string;
};
export type Accreditation = {
  id: string; org_id: string; person_name: string; person_email: string | null;
  user_id: string | null; delegation_id: string | null; category_id: string | null;
  state: AccreditationState; vetting: VettingState; card_barcode: string | null;
  valid_from: string | null; valid_to: string | null;
  issued_at: string | null; revoked_at: string | null; revoke_reason: string | null;
  photo_path: string | null; metadata: unknown; created_at: string; updated_at: string;
};
export type AccessScan = {
  id: string; org_id: string; accreditation_id: string | null;
  venue_id: string | null; zone_id: string | null; gate_code: string | null;
  result: string; reason: string | null; scanned_by: string | null;
  scanned_at: string; device_id: string | null;
};
export type AccreditationChange = {
  id: string; org_id: string; accreditation_id: string; kind: string;
  requested_by: string | null; status: string; decided_by: string | null;
  decided_at: string | null; note: string | null; created_at: string;
};
export type WorkforceMember = {
  id: string; org_id: string; user_id: string | null; kind: WorkforceKind;
  full_name: string; email: string | null; phone: string | null; role: string | null;
  skills: unknown; venue_id: string | null; metadata: unknown;
  created_at: string; updated_at: string;
};
export type Roster = {
  id: string; org_id: string; venue_id: string | null; name: string; day_of: string;
  state: RosterState; published_at: string | null; created_at: string; updated_at: string;
};
export type Shift = {
  id: string; org_id: string; roster_id: string | null;
  workforce_member_id: string | null; venue_id: string | null; zone_id: string | null;
  starts_at: string; ends_at: string; role: string | null; attendance: ShiftAttendance;
  checked_in_at: string | null; checked_out_at: string | null;
  break_minutes: number; meal_credit: boolean; created_at: string;
};
export type WorkforceDeployment = {
  id: string; org_id: string; venue_id: string; zone_id: string | null;
  shift_window: unknown; planned_fte: number; actual_fte: number;
  functional_area: string | null; created_at: string;
};
export type MajorIncident = {
  id: string; org_id: string; incident_id: string | null; name: string;
  opened_at: string; closed_at: string | null;
  ics_roles: unknown; timeline: unknown; status: string; created_at: string;
};
export type SafeguardingReport = {
  id: string; org_id: string; reporter_id: string | null; subject_ref: string | null;
  narrative: string; evidence_paths: unknown; status: string;
  assigned_to: string | null; created_at: string; updated_at: string;
};
export type MedicalEncounter = {
  id: string; org_id: string; incident_id: string | null; venue_id: string | null;
  patient_ref: string | null; triage: string | null; chief_complaint: string | null;
  disposition: string | null; clinician_id: string | null; phi_encrypted: unknown;
  created_at: string;
};
export type EnvironmentalEvent = {
  id: string; org_id: string; venue_id: string | null;
  kind: string; severity: string; reading: unknown;
  started_at: string; ended_at: string | null; created_at: string;
};
export type CrisisAlert = {
  id: string; org_id: string; title: string; body: string; severity: string;
  channels: unknown; audience: unknown; scheduled_at: string | null;
  sent_at: string | null; created_by: string | null; created_at: string;
};
export type CrisisAlertReceipt = {
  id: string; org_id: string; alert_id: string; user_id: string;
  delivered_at: string | null; acknowledged_at: string | null; channel: string | null;
};
export type Delegation = {
  id: string; org_id: string; code: string; name: string; country: string | null;
  attache_user_id: string | null; contact_email: string | null; contact_phone: string | null;
  metadata: unknown; created_at: string; updated_at: string;
};
export type DelegationEntry = {
  id: string; org_id: string; delegation_id: string; discipline: string | null;
  event: string | null; participant_name: string; status: string; created_at: string;
};
export type VisaCase = {
  id: string; org_id: string; delegation_id: string | null; person_name: string;
  nationality: string | null; passport_no: string | null; status: string;
  letter_path: string | null; created_at: string; updated_at: string;
};
export type RateCardItem = {
  id: string; org_id: string; catalog: string; sku: string; name: string;
  description: string | null; unit_price_cents: number; currency: string;
  metadata: unknown; active: boolean; created_at: string;
};
export type RateCardOrder = {
  id: string; org_id: string; catalog: string; delegation_id: string | null;
  requester_id: string | null; status: string; total_cents: number; currency: string;
  line_items: unknown; notes: string | null; created_at: string; updated_at: string;
};
export type DispatchRun = {
  id: string; org_id: string; fleet: DispatchFleet; vehicle_ref: string | null;
  driver_id: string | null; origin_venue_id: string | null; destination_venue_id: string | null;
  scheduled_depart: string; scheduled_arrive: string | null;
  actual_depart: string | null; actual_arrive: string | null;
  manifest: unknown; status: string; created_at: string;
};
export type AdManifest = {
  id: string; org_id: string; kind: string; flight_ref: string | null;
  carrier: string | null; scheduled_at: string | null; actual_at: string | null;
  party_size: number; delegation_id: string | null; notes: string | null;
  status: string; created_at: string;
};
export type AccommodationBlock = {
  id: string; org_id: string; name: string; property: string; city: string | null;
  stakeholder_group: string | null; rooms_reserved: number; rooms_confirmed: number;
  starts_on: string | null; ends_on: string | null; contract_path: string | null;
  created_at: string;
};
export type TicketType = {
  id: string; org_id: string; event_id: string | null; name: string;
  channel: string; price_cents: number; currency: string;
  allocation: number; sold: number; created_at: string;
};
export type SponsorEntitlement = {
  id: string; org_id: string; sponsor_client_id: string | null;
  title: string; quantity: number; delivered: number; status: string;
  due_by: string | null; evidence_path: string | null;
  created_at: string; updated_at: string;
};
export type DsarRequest = {
  id: string; org_id: string; requester_user_id: string | null;
  requester_email: string; kind: DsarKind; status: DsarStatus;
  identity_verified: boolean; due_by: string | null; fulfilled_at: string | null;
  payload_path: string | null; notes: string | null;
  created_at: string; updated_at: string;
};
export type ConsentRecord = {
  id: string; org_id: string; user_id: string | null; purpose: string;
  granted: boolean; version: string | null;
  granted_at: string | null; revoked_at: string | null;
};
export type Trademark = {
  id: string; org_id: string; mark: string; jurisdiction: string | null;
  registration_no: string | null; registered_on: string | null;
  expires_on: string | null; status: string; created_at: string;
};
export type InsurancePolicy = {
  id: string; org_id: string; carrier: string; policy_no: string; kind: string;
  effective_on: string | null; expires_on: string | null;
  limits: unknown; document_path: string | null; created_at: string;
};
export type IntegrationConnector = {
  id: string; org_id: string; slug: string; name: string; kind: string;
  enabled: boolean; config: unknown; secret_ref: string | null;
  created_at: string; updated_at: string;
};
export type SustainabilityMetric = {
  id: string; org_id: string; period_start: string; period_end: string;
  scope: number; kg_co2e: number; source: string | null; method: string | null;
  created_at: string;
};
export type KbArticle = {
  id: string; org_id: string; slug: string; title: string; body_markdown: string;
  tags: unknown; author_id: string | null; version: number;
  created_at: string; updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      orgs: TableDef<Org, Omit<Org, "id" | "created_at"> & { id?: string; created_at?: string }, Partial<Org>>;
      users: TableDef<User, Omit<User, "created_at"> & { created_at?: string }, Partial<User>>;
      memberships: TableDef<Membership, Omit<Membership, "id" | "created_at"> & { id?: string; created_at?: string }, Partial<Membership>>;

      projects: TableDef<
        Project,
        {
          id?: string; org_id: string; slug: string; name: string;
          description?: string | null; status?: ProjectStatus;
          start_date?: string | null; end_date?: string | null;
          client_id?: string | null; budget_cents?: number | null;
          created_by: string; created_at?: string; updated_at?: string;
        },
        Partial<Project>
      >;

      tickets: TableDef<
        Ticket,
        { id?: string; org_id: string; project_id: string; code: string;
          holder_name?: string | null; holder_email?: string | null;
          tier?: string; status?: TicketStatus; issued_at?: string;
          scanned_at?: string | null; scanned_by?: string | null; },
        Partial<Ticket>
      >;

      ticket_scans: TableDef<
        { id: string; ticket_id: string; scanner_id: string; scanned_at: string; location: unknown; result: string },
        { id?: string; ticket_id: string; scanner_id: string; scanned_at?: string; location?: unknown; result: string },
        Partial<{ id: string; ticket_id: string; scanner_id: string; scanned_at: string; location: unknown; result: string }>
      >;

      deliverables: TableDef<
        Deliverable,
        { id?: string; org_id: string; project_id: string; type: DeliverableType;
          title?: string | null; status?: DeliverableStatus; data?: unknown;
          file_path?: string | null; version?: number;
          submitted_by?: string | null; reviewed_by?: string | null;
          submitted_at?: string | null; reviewed_at?: string | null; deadline?: string | null;
          created_at?: string; updated_at?: string; },
        Partial<Deliverable>
      >;
      deliverable_comments: TableDef<
        DeliverableComment,
        { id?: string; deliverable_id: string; user_id: string; body: string; created_at?: string },
        Partial<DeliverableComment>
      >;

      clients: TableDef<
        Client,
        { id?: string; org_id: string; name: string; contact_email?: string | null; contact_phone?: string | null; website?: string | null; notes?: string | null; created_by?: string | null; created_at?: string },
        Partial<Client>
      >;
      leads: TableDef<
        Lead,
        { id?: string; org_id: string; name: string; email?: string | null; phone?: string | null; source?: string | null; stage?: LeadStage; estimated_value_cents?: number | null; assigned_to?: string | null; notes?: string | null; created_by?: string | null; created_at?: string; updated_at?: string },
        Partial<Lead>
      >;
      proposals: TableDef<
        Proposal,
        { id?: string; org_id: string; project_id?: string | null; client_id?: string | null; title: string; amount_cents?: number | null; status?: ProposalStatus; sent_at?: string | null; signed_at?: string | null; expires_at?: string | null; notes?: string | null; created_by?: string | null; created_at?: string; updated_at?: string;
          doc_number?: string | null; version?: number; theme?: { primary: string; secondary: string }; blocks?: unknown;
          signer_name?: string | null; signer_email?: string | null; signature_hash?: string | null; signature_data?: string | null;
          deposit_percent?: number; currency?: string },
        Partial<Proposal>
      >;
      proposal_share_links: TableDef<
        ProposalShareLink,
        { id?: string; proposal_id: string; token: string; audience?: string | null; created_by?: string | null; expires_at?: string | null; last_viewed_at?: string | null; view_count?: number; revoked_at?: string | null; created_at?: string },
        Partial<ProposalShareLink>
      >;
      proposal_signatures: TableDef<
        ProposalSignature,
        { id?: string; proposal_id: string; share_token?: string | null; signer_name: string; signer_email?: string | null; signer_ip?: string | null; signer_role?: string | null; signature_kind: "typed" | "canvas"; signature_hash: string; signature_data?: string | null; signed_at?: string },
        Partial<ProposalSignature>
      >;
      proposal_events: TableDef<
        { id: string; proposal_id: string; share_token: string | null; event_type: string; metadata: unknown; at: string },
        { id?: string; proposal_id: string; share_token?: string | null; event_type: string; metadata?: unknown; at?: string },
        Partial<{ id: string; proposal_id: string; share_token: string | null; event_type: string; metadata: unknown; at: string }>
      >;
      proposal_versions: TableDef<
        { id: string; proposal_id: string; version: number; blocks: unknown; theme: unknown; changed_by: string | null; changed_at: string },
        { id?: string; proposal_id: string; version: number; blocks: unknown; theme?: unknown; changed_by?: string | null; changed_at?: string },
        Partial<{ id: string; proposal_id: string; version: number; blocks: unknown; theme: unknown; changed_by: string | null; changed_at: string }>
      >;

      invoices: TableDef<
        Invoice,
        { id?: string; org_id: string; project_id?: string | null; client_id?: string | null; number: string; title: string; amount_cents?: number; currency?: string; status?: InvoiceStatus; issued_at?: string | null; due_at?: string | null; paid_at?: string | null; stripe_payment_intent?: string | null; notes?: string | null; created_by?: string | null; created_at?: string; updated_at?: string },
        Partial<Invoice>
      >;
      invoice_line_items: TableDef<
        InvoiceLineItem,
        { id?: string; invoice_id: string; description: string; quantity?: number; unit_price_cents?: number; position?: number },
        Partial<InvoiceLineItem>
      >;
      expenses: TableDef<
        Expense,
        { id?: string; org_id: string; project_id?: string | null; submitter_id: string; category?: string | null; description: string; amount_cents: number; currency?: string; status?: ExpenseStatus; receipt_path?: string | null; spent_at: string; created_at?: string; updated_at?: string },
        Partial<Expense>
      >;
      budgets: TableDef<
        Budget,
        { id?: string; org_id: string; project_id?: string | null; name: string; category?: string | null; amount_cents?: number; spent_cents?: number; created_at?: string },
        Partial<Budget>
      >;
      time_entries: TableDef<
        TimeEntry,
        { id?: string; org_id: string; project_id?: string | null; user_id: string; description?: string | null; started_at: string; ended_at?: string | null; duration_minutes?: number | null; billable?: boolean; created_at?: string },
        Partial<TimeEntry>
      >;
      mileage_logs: TableDef<
        MileageLog,
        { id?: string; org_id: string; project_id?: string | null; user_id: string; origin: string; destination: string; miles: number; rate_cents?: number; logged_on: string; notes?: string | null; created_at?: string },
        Partial<MileageLog>
      >;
      advances: TableDef<
        Advance,
        { id?: string; org_id: string; project_id?: string | null; requester_id: string; amount_cents: number; currency?: string; reason?: string | null; status?: AdvanceStatus; requested_at?: string; decided_at?: string | null },
        Partial<Advance>
      >;

      vendors: TableDef<
        Vendor,
        { id?: string; org_id: string; name: string; contact_email?: string | null; contact_phone?: string | null; category?: string | null; w9_on_file?: boolean; coi_expires_at?: string | null; payout_account_id?: string | null; notes?: string | null; created_at?: string },
        Partial<Vendor>
      >;
      requisitions: TableDef<
        Requisition,
        { id?: string; org_id: string; project_id?: string | null; requester_id: string; title: string; description?: string | null; estimated_cents?: number | null; status?: ReqStatus; created_at?: string },
        Partial<Requisition>
      >;
      purchase_orders: TableDef<
        PurchaseOrder,
        { id?: string; org_id: string; project_id?: string | null; vendor_id?: string | null; requisition_id?: string | null; number: string; title: string; amount_cents?: number; currency?: string; status?: POStatus; created_by?: string | null; created_at?: string; updated_at?: string },
        Partial<PurchaseOrder>
      >;
      po_line_items: TableDef<
        POLineItem,
        { id?: string; purchase_order_id: string; description: string; quantity?: number; unit_price_cents?: number; position?: number },
        Partial<POLineItem>
      >;

      equipment: TableDef<
        Equipment,
        { id?: string; org_id: string; name: string; category?: string | null; asset_tag?: string | null; serial?: string | null; status?: EquipmentStatus; location_id?: string | null; daily_rate_cents?: number | null; notes?: string | null; created_at?: string },
        Partial<Equipment>
      >;
      rentals: TableDef<
        Rental,
        { id?: string; org_id: string; project_id?: string | null; equipment_id: string; starts_at: string; ends_at: string; rate_cents?: number | null; notes?: string | null; created_at?: string },
        Partial<Rental>
      >;
      fabrication_orders: TableDef<
        FabricationOrder,
        { id?: string; org_id: string; project_id?: string | null; title: string; description?: string | null; due_at?: string | null; status?: FabricationStatus; created_at?: string },
        Partial<FabricationOrder>
      >;

      tasks: TableDef<
        Task,
        { id?: string; org_id: string; project_id?: string | null; title: string; description?: string | null; status?: TaskStatus; priority?: number; due_at?: string | null; assigned_to?: string | null; created_by?: string | null; created_at?: string; updated_at?: string },
        Partial<Task>
      >;
      events: TableDef<
        EventRow,
        { id?: string; org_id: string; project_id?: string | null; name: string; starts_at: string; ends_at: string; location_id?: string | null; status?: EventStatus; description?: string | null; created_at?: string },
        Partial<EventRow>
      >;
      locations: TableDef<
        Location,
        { id?: string; org_id: string; name: string; address?: string | null; city?: string | null; region?: string | null; country?: string | null; postcode?: string | null; lat?: number | null; lng?: number | null; notes?: string | null; created_at?: string },
        Partial<Location>
      >;
      crew_members: TableDef<
        CrewMember,
        { id?: string; org_id: string; user_id?: string | null; name: string; role?: string | null; phone?: string | null; email?: string | null; day_rate_cents?: number | null; notes?: string | null; created_at?: string },
        Partial<CrewMember>
      >;
      credentials: TableDef<
        Credential,
        { id?: string; org_id: string; crew_member_id?: string | null; kind: string; number?: string | null; issued_on?: string | null; expires_on?: string | null; file_path?: string | null; created_at?: string },
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
        { id?: string; org_id: string; actor_id?: string | null; action: string; target_table?: string | null; target_id?: string | null; metadata?: unknown; at?: string },
        Partial<AuditLog>
      >;
      notifications: TableDef<
        Notification,
        { id?: string; org_id: string; user_id: string; title: string; body?: string | null; href?: string | null; read_at?: string | null; created_at?: string },
        Partial<Notification>
      >;
      event_guides: TableDef<
        EventGuide,
        { id?: string; org_id: string; project_id: string; persona: GuidePersona; tier?: number;
          classification?: string | null; slug?: string | null; title: string; subtitle?: string | null;
          published?: boolean; config?: unknown; created_by?: string | null;
          created_at?: string; updated_at?: string; },
        Partial<EventGuide>
      >;

      // ═══ Olympic-scope (fbw_030) ═══════════════════════════════════════
      risks: TableDef<Risk, Partial<Risk> & { org_id: string; title: string }, Partial<Risk>>;
      program_reviews: TableDef<ProgramReview, Partial<ProgramReview> & { org_id: string; title: string; scheduled_at: string }, Partial<ProgramReview>>;
      readiness_exercises: TableDef<ReadinessExercise, Partial<ReadinessExercise> & { org_id: string; name: string }, Partial<ReadinessExercise>>;
      venues: TableDef<Venue, Partial<Venue> & { org_id: string; name: string }, Partial<Venue>>;
      venue_zones: TableDef<VenueZone, Partial<VenueZone> & { org_id: string; venue_id: string; code: string; name: string }, Partial<VenueZone>>;
      venue_certifications: TableDef<VenueCertification, Partial<VenueCertification> & { org_id: string; venue_id: string; issuer: string; certificate: string }, Partial<VenueCertification>>;
      accreditation_categories: TableDef<AccreditationCategory, Partial<AccreditationCategory> & { org_id: string; code: string; name: string }, Partial<AccreditationCategory>>;
      accreditations: TableDef<Accreditation, Partial<Accreditation> & { org_id: string; person_name: string }, Partial<Accreditation>>;
      access_scans: TableDef<AccessScan, Partial<AccessScan> & { org_id: string; result: string }, Partial<AccessScan>>;
      accreditation_changes: TableDef<AccreditationChange, Partial<AccreditationChange> & { org_id: string; accreditation_id: string; kind: string }, Partial<AccreditationChange>>;
      workforce_members: TableDef<WorkforceMember, Partial<WorkforceMember> & { org_id: string; full_name: string }, Partial<WorkforceMember>>;
      rosters: TableDef<Roster, Partial<Roster> & { org_id: string; name: string; day_of: string }, Partial<Roster>>;
      shifts: TableDef<Shift, Partial<Shift> & { org_id: string; starts_at: string; ends_at: string }, Partial<Shift>>;
      workforce_deployments: TableDef<WorkforceDeployment, Partial<WorkforceDeployment> & { org_id: string; venue_id: string }, Partial<WorkforceDeployment>>;
      major_incidents: TableDef<MajorIncident, Partial<MajorIncident> & { org_id: string; name: string }, Partial<MajorIncident>>;
      safeguarding_reports: TableDef<SafeguardingReport, Partial<SafeguardingReport> & { org_id: string; narrative: string }, Partial<SafeguardingReport>>;
      medical_encounters: TableDef<MedicalEncounter, Partial<MedicalEncounter> & { org_id: string }, Partial<MedicalEncounter>>;
      environmental_events: TableDef<EnvironmentalEvent, Partial<EnvironmentalEvent> & { org_id: string; kind: string; severity: string }, Partial<EnvironmentalEvent>>;
      crisis_alerts: TableDef<CrisisAlert, Partial<CrisisAlert> & { org_id: string; title: string; body: string }, Partial<CrisisAlert>>;
      crisis_alert_receipts: TableDef<CrisisAlertReceipt, Partial<CrisisAlertReceipt> & { org_id: string; alert_id: string; user_id: string }, Partial<CrisisAlertReceipt>>;
      delegations: TableDef<Delegation, Partial<Delegation> & { org_id: string; code: string; name: string }, Partial<Delegation>>;
      delegation_entries: TableDef<DelegationEntry, Partial<DelegationEntry> & { org_id: string; delegation_id: string; participant_name: string }, Partial<DelegationEntry>>;
      visa_cases: TableDef<VisaCase, Partial<VisaCase> & { org_id: string; person_name: string }, Partial<VisaCase>>;
      rate_card_items: TableDef<RateCardItem, Partial<RateCardItem> & { org_id: string; sku: string; name: string }, Partial<RateCardItem>>;
      rate_card_orders: TableDef<RateCardOrder, Partial<RateCardOrder> & { org_id: string }, Partial<RateCardOrder>>;
      dispatch_runs: TableDef<DispatchRun, Partial<DispatchRun> & { org_id: string; scheduled_depart: string }, Partial<DispatchRun>>;
      ad_manifests: TableDef<AdManifest, Partial<AdManifest> & { org_id: string }, Partial<AdManifest>>;
      accommodation_blocks: TableDef<AccommodationBlock, Partial<AccommodationBlock> & { org_id: string; name: string; property: string }, Partial<AccommodationBlock>>;
      ticket_types: TableDef<TicketType, Partial<TicketType> & { org_id: string; name: string }, Partial<TicketType>>;
      sponsor_entitlements: TableDef<SponsorEntitlement, Partial<SponsorEntitlement> & { org_id: string; title: string }, Partial<SponsorEntitlement>>;
      dsar_requests: TableDef<DsarRequest, Partial<DsarRequest> & { org_id: string; requester_email: string }, Partial<DsarRequest>>;
      consent_records: TableDef<ConsentRecord, Partial<ConsentRecord> & { org_id: string; purpose: string }, Partial<ConsentRecord>>;
      trademarks: TableDef<Trademark, Partial<Trademark> & { org_id: string; mark: string }, Partial<Trademark>>;
      insurance_policies: TableDef<InsurancePolicy, Partial<InsurancePolicy> & { org_id: string; carrier: string; policy_no: string; kind: string }, Partial<InsurancePolicy>>;
      integration_connectors: TableDef<IntegrationConnector, Partial<IntegrationConnector> & { org_id: string; slug: string; name: string; kind: string }, Partial<IntegrationConnector>>;
      sustainability_metrics: TableDef<SustainabilityMetric, Partial<SustainabilityMetric> & { org_id: string; period_start: string; period_end: string }, Partial<SustainabilityMetric>>;
      kb_articles: TableDef<KbArticle, Partial<KbArticle> & { org_id: string; slug: string; title: string; body_markdown: string }, Partial<KbArticle>>;
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      platform_role: PlatformRole; project_role: ProjectRole; tier: Tier;
      project_status: ProjectStatus; ticket_status: TicketStatus;
      deliverable_status: DeliverableStatus; deliverable_type: DeliverableType;
      lead_stage: LeadStage;
      proposal_status: ProposalStatus; invoice_status: InvoiceStatus;
      expense_status: ExpenseStatus; po_status: POStatus; req_status: ReqStatus;
      equipment_status: EquipmentStatus; task_status: TaskStatus;
      event_status: EventStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
