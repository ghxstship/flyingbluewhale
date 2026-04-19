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
