/* ═══════════════════════════════════════════════════════
   GVTEWAY Database Types
   Auto-generated types: see database.types.ts
   This file re-exports generated types and provides
   role helper constants/functions.
   ═══════════════════════════════════════════════════════ */

export type { Database, Json } from './database.types';
export type { Tables, TablesInsert, TablesUpdate, Enums } from './database.types';

import type { Database } from './database.types';

/* ─── Convenience Aliases ─── */

export type PlatformRole = Database['public']['Enums']['platform_role'];
/**
 * ProjectRole — narrowed from platform_role enum.
 * project_members.role uses the same platform_role enum, but
 * a CHECK constraint (migration 011) restricts valid values to
 * only these 12 project-scoped roles.
 * Platform roles (developer, owner, admin, team_member, collaborator)
 * are constrained to organization_members.role only.
 */
export type ProjectRole =
  | 'executive' | 'production' | 'management'
  | 'crew' | 'staff' | 'talent'
  | 'vendor' | 'client' | 'sponsor'
  | 'press' | 'guest' | 'attendee';
export type ProjectType = Database['public']['Enums']['project_type'];
export type ProjectStatus = Database['public']['Enums']['project_status'];
export type DeliverableType = Database['public']['Enums']['deliverable_type'];
export type DeliverableStatus = Database['public']['Enums']['deliverable_status'];
export type AllocationState = Database['public']['Enums']['allocation_state'];
export type CateringAllocationStatus = Database['public']['Enums']['catering_alloc_status'];
export type NotificationChannel = Database['public']['Enums']['notification_channel'];
export type PortalTrack = Database['public']['Enums']['portal_track'];
/** Forward-declared — role_lifecycle_stage enum pending migration */
export type RoleLifecycleStage =
  | 'invited' | 'onboarding' | 'qualifying' | 'active' | 'on_hold'
  | 'suspended' | 'offboarding' | 'alumni' | 'terminated' | 'archived'
  | 'discovery' | 'qualification' | 'contracting' | 'scheduling'
  | 'advancing' | 'deployment' | 'active_operations' | 'demobilization'
  | 'settlement' | 'reconciliation' | 'archival' | 'closeout';

/* ─── Red Sea Lion Settlement & Compliance Enums ─── */
export type QualificationCheckType = 'coi' | 'w9' | 'w8' | 'background_check' | 'insurance' | 'union_card' | 'drivers_license' | 'work_authorization' | 'visa' | 'nda' | 'custom';
export type QualificationStatus = 'pending' | 'submitted' | 'under_review' | 'verified' | 'rejected' | 'expired';
export type ContractType = 'deal_memo' | 'vendor_agreement' | 'performance_contract' | 'employment_agreement' | 'nda' | 'sponsorship_agreement' | 'media_release' | 'venue_license' | 'custom';
export type ContractStatus = 'draft' | 'pending_review' | 'sent' | 'countersigned' | 'executed' | 'amendment' | 'terminated' | 'expired';
export type ShiftStatus = 'draft' | 'published' | 'acknowledged' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type TimesheetStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'void' | 'disputed';
export type InvoiceDirection = 'inbound' | 'outbound';
export type ExpenseStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'reimbursed';
export type PersonStatus = 'active' | 'inactive' | 'on_leave';
export type EmploymentType = 'w2' | '1099' | 'c2c' | 'volunteer' | 'salary';

/* ─── Atomic Production System Enums ─── */
export type ProductionLevelStatus = 'draft' | 'advancing' | 'confirmed' | 'locked' | 'complete' | 'archived';
export type ZoneType = 'stage' | 'vip' | 'ga' | 'perimeter' | 'foh' | 'boh' | 'entrance' | 'food_court' | 'merch' | 'medical' | 'production_compound' | 'parking' | 'custom';
export type ActivationType = 'performance' | 'sampling' | 'photo_op' | 'installation' | 'service' | 'retail' | 'registration' | 'lounge' | 'dining' | 'bar' | 'custom';
export type ComponentType = 'buildable' | 'scenic' | 'technical' | 'service' | 'furniture' | 'signage' | 'infrastructure' | 'custom';
export type TaskStatus = 'pending' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';

/* ─── Table Row Types ─── */

export type Organization = Database['public']['Tables']['organizations']['Row'];
export type OrganizationMember = Database['public']['Tables']['organization_members']['Row'];
export type Project = Database['public']['Tables']['projects']['Row'];
export type ProjectMember = Database['public']['Tables']['project_members']['Row'];
export type Space = Database['public']['Tables']['spaces']['Row'];
export type Act = Database['public']['Tables']['acts']['Row'];
export type AdvanceCategoryGroup = Database['public']['Tables']['advance_category_groups']['Row'];
export type AdvanceCategory = Database['public']['Tables']['advance_categories']['Row'];
export type AdvanceSubcategory = Database['public']['Tables']['advance_subcategories']['Row'];
export type AdvanceItem = Database['public']['Tables']['advance_items']['Row'];
export type CatalogItemInterchange = Database['public']['Tables']['catalog_item_interchange']['Row'];
export type CatalogItemSupersession = Database['public']['Tables']['catalog_item_supersession']['Row'];
export type CatalogItemFitment = Database['public']['Tables']['catalog_item_fitment']['Row'];
export type CatalogItemInventory = Database['public']['Tables']['catalog_item_inventory']['Row'];
export type CatalogItemAllocation = Database['public']['Tables']['catalog_item_allocations']['Row'];
export type Deliverable = Database['public']['Tables']['deliverables']['Row'];
export type DeliverableComment = Database['public']['Tables']['deliverable_comments']['Row'];
export type DeliverableHistory = Database['public']['Tables']['deliverable_history']['Row'];
export type CateringMealPlan = Database['public']['Tables']['catering_meal_plans']['Row'];
export type CateringAllocation = Database['public']['Tables']['catering_allocations']['Row'];
export type CateringCheckIn = Database['public']['Tables']['catering_check_ins']['Row'];
export type NotificationTemplate = Database['public']['Tables']['notification_templates']['Row'];
export type NotificationLog = Database['public']['Tables']['notification_log']['Row'];
export type CmsPage = Database['public']['Tables']['cms_pages']['Row'];
export type CmsRevision = Database['public']['Tables']['cms_revisions']['Row'];
export type ProjectTemplate = Database['public']['Tables']['project_templates']['Row'];
export type SubmissionTemplate = Database['public']['Tables']['submission_templates']['Row'];
export type Location = Database['public']['Tables']['locations']['Row'];
export type CredentialZone = Database['public']['Tables']['credential_zones']['Row'];
export type CredentialCheckIn = Database['public']['Tables']['credential_check_ins']['Row'];
export type AssetInstance = Database['public']['Tables']['asset_instances']['Row'];
export type ShipmentEvent = Database['public']['Tables']['shipment_events']['Row'];
/** Forward-declared — project_member_lifecycles table pending migration */
export type ProjectMemberLifecycle = {
  id: string;
  project_member_id: string;
  stage: RoleLifecycleStage;
  entered_at: string;
  exited_at: string | null;
  triggered_by: string | null;
  notes: string | null;
  metadata: Record<string, any>;
  created_at: string;
};

/* ─── Red Sea Lion: Qualification, Contracts, Settlement Row Types ─── */
export type QualificationCheck = { id: string; project_id: string; user_id: string; check_type: QualificationCheckType; status: QualificationStatus; document_id: string | null; reviewed_by: string | null; reviewed_at: string | null; expires_at: string | null; notes: string | null; metadata: Record<string, any>; created_at: string; updated_at: string };
export type QualificationRequirement = { id: string; project_id: string; role: ProjectRole; check_type: QualificationCheckType; is_required: boolean; created_at: string };
export type Contract = { id: string; project_id: string; organization_id: string; type: ContractType; status: ContractStatus; title: string; user_id: string | null; vendor_id: string | null; rate_amount: number | null; rate_unit: string | null; currency: string; total_value: number | null; payment_terms: string | null; document_id: string | null; sent_at: string | null; signed_at: string | null; executed_at: string | null; expires_at: string | null; notes: string | null; metadata: Record<string, any>; created_by: string; created_at: string; updated_at: string };
export type Shift = { id: string; project_id: string; user_id: string | null; role: ProjectRole | null; starts_at: string; ends_at: string; break_minutes: number; location_id: string | null; status: ShiftStatus; checked_in_at: string | null; checked_out_at: string | null; pay_rate: number | null; pay_rate_unit: string | null; title: string | null; notes: string | null; metadata: Record<string, any>; created_by: string; created_at: string; updated_at: string };
export type Timesheet = { id: string; project_id: string; user_id: string; shift_id: string | null; date: string; hours_regular: number; hours_overtime: number; hours_double_time: number; break_minutes: number; rate_regular: number | null; rate_overtime: number | null; rate_double_time: number | null; total_pay: number; status: TimesheetStatus; submitted_at: string | null; approved_by: string | null; approved_at: string | null; notes: string | null; metadata: Record<string, any>; created_at: string; updated_at: string };
export type Invoice = { id: string; organization_id: string; project_id: string | null; invoice_number: string; direction: InvoiceDirection; status: InvoiceStatus; vendor_id: string | null; client_user_id: string | null; counterparty_name: string | null; issue_date: string; due_date: string | null; paid_at: string | null; subtotal: number; tax_total: number; total_amount: number; amount_paid: number; balance_due: number; currency: string; purchase_order_id: string | null; notes: string | null; terms: string | null; metadata: Record<string, any>; created_by: string; created_at: string; updated_at: string };
export type Expense = { id: string; organization_id: string; project_id: string | null; user_id: string; date: string; amount: number; currency: string; category: string; vendor_name: string | null; description: string | null; receipt_url: string | null; status: ExpenseStatus; submitted_at: string | null; approved_by: string | null; approved_at: string | null; reimbursed_at: string | null; metadata: Record<string, any>; created_at: string; updated_at: string };
export type Person = { id: string; organization_id: string; user_id: string | null; manager_id: string | null; first_name: string; last_name: string; full_name: string; email: string | null; phone: string | null; title: string | null; department: string | null; employment_type: EmploymentType; status: PersonStatus; hire_date: string | null; in_recall_pool: boolean; performance_rating: number | null; metadata: Record<string, any>; created_at: string; updated_at: string };

/* ─── Red Sea Lion: Operational Extensions Row Types (Migration 012) ─── */
export type ShiftRule = { id: string; project_id: string; union_affiliation: string | null; max_shift_hours: number; min_rest_between_shifts_hours: number; max_consecutive_days: number; meal_break_required_after_hours: number; meal_break_duration_minutes: number; meal_penalty_rate: number | null; overtime_after_hours: number; double_time_after_hours: number; weekly_overtime_after_hours: number; per_diem_rate: number | null; notes: string | null; metadata: Record<string, any>; created_at: string; updated_at: string };
export type TravelArrangement = { id: string; project_id: string; user_id: string; type: TravelType; status: TravelStatus; title: string; confirmation_number: string | null; provider: string | null; starts_at: string | null; ends_at: string | null; origin: string | null; destination: string | null; cost: number | null; currency: string; is_reimbursable: boolean; notes: string | null; metadata: Record<string, any>; created_by: string; created_at: string; updated_at: string };
export type RiderFulfillment = { id: string; deliverable_id: string; item_key: string; item_description: string; allocation_id: string | null; advance_item_id: string | null; status: RiderFulfillmentStatus; substitute_notes: string | null; fulfilled_by: string | null; fulfilled_at: string | null; created_at: string; updated_at: string };
export type DeploymentHandoff = { id: string; project_id: string; asset_instance_id: string | null; allocation_id: string | null; handed_to: string; handed_by: string; description: string; quantity: number; condition_at_handoff: string | null; handed_at: string; returned_at: string | null; returned_condition: string | null; photo_document_id: string | null; signature_url: string | null; notes: string | null; created_at: string };
export type OnsiteBriefing = { id: string; project_id: string; title: string; content: string | null; document_id: string | null; required_for_roles: string[]; created_by: string; created_at: string };
export type BriefingAcknowledgment = { id: string; briefing_id: string; user_id: string; acknowledged_at: string };
export type Incident = { id: string; project_id: string; title: string; description: string | null; severity: IncidentSeverity; status: IncidentStatus; location_id: string | null; location_description: string | null; reporter_id: string; assigned_to: string | null; resolved_at: string | null; resolved_by: string | null; resolution_notes: string | null; metadata: Record<string, any>; created_at: string; updated_at: string };
export type ChangeOrder = { id: string; project_id: string; type: ChangeOrderType; status: ChangeOrderStatus; title: string; description: string; justification: string | null; impact_amount: number | null; impact_schedule_days: number | null; impact_description: string | null; requested_by: string; approved_by: string | null; approved_at: string | null; metadata: Record<string, any>; created_at: string; updated_at: string };
export type LifecycleTransitionLog = { id: string; project_id: string; user_id: string; from_stage: RoleLifecycleStage; to_stage: RoleLifecycleStage; transitioned_by: string | null; transition_notes: string | null; metadata: Record<string, any>; transitioned_at: string };

/* ─── Red Sea Lion: Financial Reconciliation Row Types (Migration 013) ─── */
export type TaxDocument = { id: string; organization_id: string; recipient_user_id: string | null; recipient_vendor_id: string | null; recipient_name: string; type: TaxDocumentType; fiscal_year: number; total_amount_paid: number; federal_tax_withheld: number; state_tax_withheld: number; tin_last_four: string | null; filed_at: string | null; filed_by: string | null; document_id: string | null; status: string; metadata: Record<string, any>; created_at: string; updated_at: string };
export type MemberPerformanceReview = { id: string; project_id: string; user_id: string; reviewer_id: string; rating: number; reliability_rating: number | null; quality_rating: number | null; communication_rating: number | null; strengths: string | null; areas_for_improvement: string | null; notes: string | null; would_rehire: boolean; created_at: string; updated_at: string };
export type ProjectRetrospective = { id: string; project_id: string; author_id: string; category: string; content: string; action_items: string | null; assigned_to: string | null; priority: string; is_resolved: boolean; resolved_at: string | null; created_at: string; updated_at: string };

/* ─── Atomic Production System Row Types ─── */
/* ─── Atomic Production System Row Types (Mocked until migration unblocks) ─── */
export type Event = { id: string, name: string, status: ProductionLevelStatus } & Record<string, any>;
export type Zone = { id: string, name: string, type: ZoneType } & Record<string, any>;
export type Activation = { id: string, name: string, type: ActivationType } & Record<string, any>;
export type Component = { id: string, name: string, type: ComponentType } & Record<string, any>;
export type ComponentItem = { id: string } & Record<string, any>;
export type HierarchyTask = { id: string, status: TaskStatus } & Record<string, any>;

/* ─── Location Helpers ─── */

export const LOCATION_TYPES = [
  'warehouse', 'site', 'dock', 'stage', 'storage', 'vehicle', 'vendor',
  'venue', 'office', 'room', 'gate', 'zone', 'loading_bay', 'parking',
  'green_room', 'production_office', 'kitchen', 'bar', 'dining',
  'performance', 'backstage', 'other',
] as const;

export type LocationType = (typeof LOCATION_TYPES)[number];

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  warehouse: 'Warehouse', site: 'Site', dock: 'Dock', stage: 'Stage',
  storage: 'Storage', vehicle: 'Vehicle', vendor: 'Vendor', venue: 'Venue',
  office: 'Office', room: 'Room', gate: 'Gate', zone: 'Zone',
  loading_bay: 'Loading Bay', parking: 'Parking', green_room: 'Green Room',
  production_office: 'Production Office', kitchen: 'Kitchen', bar: 'Bar',
  dining: 'Dining', performance: 'Performance', backstage: 'Backstage',
  other: 'Other',
};

export const LOCATION_TYPE_ICONS: Record<LocationType, string> = {
  warehouse: '🏭', site: '📍', dock: '🚢', stage: '🎤', storage: '📦',
  vehicle: '🚛', vendor: '🏪', venue: '🏟️', office: '🏢', room: '🚪',
  gate: '🚧', zone: '🔲', loading_bay: '🅿️', parking: '🅿️',
  green_room: '🌿', production_office: '🗂️', kitchen: '🍳', bar: '🍸',
  dining: '🍽️', performance: '🎭', backstage: '🎪', other: '📌',
};

/* ─── Platform Role Helpers (org-scoped, internal) ─── */

export const PLATFORM_ROLES: PlatformRole[] = [
  'developer', 'owner', 'admin', 'team_member', 'collaborator',
];

/** Roles with org-level admin privileges */
export const ADMIN_PLATFORM_ROLES: PlatformRole[] = [
  'developer', 'owner', 'admin',
];

/* ─── Project Role Helpers (project-scoped) ─── */

/** Full write access — operations backbone */
export const INTERNAL_PROJECT_ROLES: ProjectRole[] = [
  'executive', 'production',
];

/** Operations roles with day-of-show + build/strike access */
export const OPERATIONS_PROJECT_ROLES: ProjectRole[] = [
  'executive', 'production', 'management', 'crew', 'staff',
];

/** Talent/creative roles */
export const TALENT_PROJECT_ROLES: ProjectRole[] = [
  'management', 'talent', 'crew',
];

/** External stakeholder roles */
export const EXTERNAL_PROJECT_ROLES: ProjectRole[] = [
  'vendor', 'client', 'sponsor', 'press', 'guest', 'attendee',
];

/** All project roles */
export const ALL_PROJECT_ROLES: ProjectRole[] = [
  'executive', 'production', 'management', 'crew', 'staff',
  'talent', 'vendor', 'client', 'sponsor', 'press', 'guest', 'attendee',
];

export const ROLE_LIFECYCLE_STAGES: RoleLifecycleStage[] = [
  'discovery', 'qualification', 'onboarding', 'contracting', 'scheduling',
  'advancing', 'deployment', 'active_operations', 'demobilization',
  'settlement', 'reconciliation', 'archival', 'closeout',
];

export const ROLE_LIFECYCLE_STAGE_LABELS: Record<RoleLifecycleStage, string> = {
  invited: 'Invited', onboarding: 'Onboarding', qualifying: 'Qualifying',
  active: 'Active', on_hold: 'On Hold', suspended: 'Suspended',
  offboarding: 'Offboarding', alumni: 'Alumni', terminated: 'Terminated',
  archived: 'Archived',
  discovery: 'Discovery', qualification: 'Qualification',
  contracting: 'Contracting', scheduling: 'Scheduling', advancing: 'Advancing',
  deployment: 'Deployment', active_operations: 'Active Operations',
  demobilization: 'Demobilization', settlement: 'Settlement',
  reconciliation: 'Reconciliation', archival: 'Archival', closeout: 'Closeout',
};

export const QUALIFICATION_CHECK_TYPES: QualificationCheckType[] = [
  'coi', 'w9', 'w8', 'background_check', 'insurance', 'union_card',
  'drivers_license', 'work_authorization', 'visa', 'nda', 'custom',
];

export const CONTRACT_TYPES: ContractType[] = [
  'deal_memo', 'vendor_agreement', 'performance_contract', 'employment_agreement',
  'nda', 'sponsorship_agreement', 'media_release', 'venue_license', 'custom',
];

export const CONTRACT_STATUSES: ContractStatus[] = [
  'draft', 'pending_review', 'sent', 'countersigned', 'executed',
  'amendment', 'terminated', 'expired',
];

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  draft: 'Draft', pending_review: 'Pending Review', sent: 'Sent',
  countersigned: 'Countersigned', executed: 'Executed',
  amendment: 'Amendment', terminated: 'Terminated', expired: 'Expired',
};

export const INVOICE_STATUSES: InvoiceStatus[] = [
  'draft', 'sent', 'paid', 'partially_paid', 'overdue', 'void', 'disputed',
];

export const EMPLOYMENT_CLASSES = ['w2', '1099', 'c2c', 'volunteer'] as const;
export type EmploymentClass = (typeof EMPLOYMENT_CLASSES)[number];

/* ─── Operational Extension Enums ─── */
export type TravelType = 'flight' | 'hotel' | 'ground_transport' | 'rental_car' | 'per_diem' | 'buyout' | 'shuttle' | 'parking' | 'other';
export type TravelStatus = 'requested' | 'booked' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'no_show';
export type RiderFulfillmentStatus = 'pending' | 'sourcing' | 'allocated' | 'fulfilled' | 'substituted' | 'declined';
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';
export type ChangeOrderType = 'scope' | 'schedule' | 'budget' | 'personnel' | 'technical' | 'other';
export type ChangeOrderStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'implemented' | 'withdrawn';
export type TaxDocumentType = '1099_nec' | '1099_misc' | 'w2' | 'w9_filed' | 'w8_filed' | 'other';

export const INCIDENT_SEVERITIES: IncidentSeverity[] = ['low', 'medium', 'high', 'critical'];
export const INCIDENT_SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical',
};
export const CHANGE_ORDER_TYPES: ChangeOrderType[] = ['scope', 'schedule', 'budget', 'personnel', 'technical', 'other'];
export const TRAVEL_TYPES: TravelType[] = ['flight', 'hotel', 'ground_transport', 'rental_car', 'per_diem', 'buyout', 'shuttle', 'parking', 'other'];

/** Role → Portal Track mapping for middleware routing */
export const ROLE_TRACK_MAP: Record<string, string> = {
  executive: 'production', production: 'production', management: 'management',
  crew: 'crew', staff: 'staff', talent: 'artist',
  vendor: 'vendor', client: 'client', sponsor: 'sponsor',
  press: 'press', guest: 'guest', attendee: 'attendee',
};

/* ─── Role Check Functions ─── */

export function isInternalProjectRole(role: ProjectRole): boolean {
  return INTERNAL_PROJECT_ROLES.includes(role);
}

export function isOperationsRole(role: ProjectRole): boolean {
  return OPERATIONS_PROJECT_ROLES.includes(role);
}

export function isTalentRole(role: ProjectRole): boolean {
  return TALENT_PROJECT_ROLES.includes(role);
}

export function isAdminPlatformRole(role: PlatformRole): boolean {
  return ADMIN_PLATFORM_ROLES.includes(role);
}

export function isInternalRole(role: PlatformRole): boolean {
  return ADMIN_PLATFORM_ROLES.includes(role);
}

export function canSeeFullCatalog(role: ProjectRole): boolean {
  return OPERATIONS_PROJECT_ROLES.includes(role) || role === 'vendor' || role === 'client';
}

/* ─── Atomic Production System Constants ─── */

/** Production level status lifecycle */
export const PRODUCTION_LEVEL_STATUSES: ProductionLevelStatus[] = [
  'draft', 'advancing', 'confirmed', 'locked', 'complete', 'archived',
];

/** Zone type options */
export const ZONE_TYPES: ZoneType[] = [
  'stage', 'vip', 'ga', 'perimeter', 'foh', 'boh',
  'entrance', 'food_court', 'merch', 'medical',
  'production_compound', 'parking', 'custom',
];

export const ZONE_TYPE_LABELS: Record<ZoneType, string> = {
  stage: 'Stage', vip: 'VIP', ga: 'General Admission', perimeter: 'Perimeter',
  foh: 'Front of House', boh: 'Back of House', entrance: 'Entrance',
  food_court: 'Food Court', merch: 'Merchandise', medical: 'Medical',
  production_compound: 'Production Compound', parking: 'Parking', custom: 'Custom',
};

export const ZONE_TYPE_ICONS: Record<ZoneType, string> = {
  stage: '🎤', vip: '⭐', ga: '🎫', perimeter: '🔒',
  foh: '🎛️', boh: '🔧', entrance: '🚪',
  food_court: '🍔', merch: '🛍️', medical: '🏥',
  production_compound: '🏗️', parking: '🅿️', custom: '📐',
};

/** Activation type options */
export const ACTIVATION_TYPES: ActivationType[] = [
  'performance', 'sampling', 'photo_op', 'installation',
  'service', 'retail', 'registration', 'lounge',
  'dining', 'bar', 'custom',
];

export const ACTIVATION_TYPE_LABELS: Record<ActivationType, string> = {
  performance: 'Performance', sampling: 'Sampling', photo_op: 'Photo Op',
  installation: 'Installation', service: 'Service', retail: 'Retail',
  registration: 'Registration', lounge: 'Lounge', dining: 'Dining',
  bar: 'Bar', custom: 'Custom',
};

/** Component type options */
export const COMPONENT_TYPES: ComponentType[] = [
  'buildable', 'scenic', 'technical', 'service',
  'furniture', 'signage', 'infrastructure', 'custom',
];

export const COMPONENT_TYPE_LABELS: Record<ComponentType, string> = {
  buildable: 'Buildable', scenic: 'Scenic', technical: 'Technical',
  service: 'Service', furniture: 'Furniture', signage: 'Signage',
  infrastructure: 'Infrastructure', custom: 'Custom',
};

/** Status display labels */
export const PRODUCTION_STATUS_LABELS: Record<ProductionLevelStatus, string> = {
  draft: 'Draft', advancing: 'Advancing', confirmed: 'Confirmed',
  locked: 'Locked', complete: 'Complete', archived: 'Archived',
};

/** Status display colors (CSS tokens) */
export const PRODUCTION_STATUS_COLORS: Record<ProductionLevelStatus, string> = {
  draft: '#95A5A6', advancing: '#F5A623', confirmed: '#7ED321',
  locked: '#4A90D9', complete: '#2ECC71', archived: '#8E8E93',
};

/** Catalog collection group brand colors (from Atomic Production spec) */
export const COLLECTION_GROUP_COLORS: Record<string, string> = {
  site: '#4A90D9',
  technical: '#E91E8C',
  scenic: '#FF6B35',
  hospitality: '#F5A623',
  'food-beverage': '#D0021B',
  retail: '#7ED321',
  workplace: '#9013FE',
  transport: '#50E3C2',
  labor: '#BD10E0',
  compliance: '#8B572A',
};

/**
 * Hierarchy level labels for UI rendering.
 * Maps each level (L1–L6) to its display name.
 */
export const HIERARCHY_LEVEL_LABELS = {
  project: 'Project',
  event: 'Event',
  zone: 'Zone',
  activation: 'Activation',
  component: 'Component',
  item: 'Item',
} as const;

export type HierarchyLevel = keyof typeof HIERARCHY_LEVEL_LABELS;
