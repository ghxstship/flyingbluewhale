/* ═══════════════════════════════════════════════════════
   GVTEWAY Database Types
   Auto-generated types will replace this file after
   running: npx supabase gen types typescript
   Until then, these manual types define the schema.
   ═══════════════════════════════════════════════════════ */

/* ─── Enums ─── */

export type PlatformRole =
  | 'developer'
  | 'owner'
  | 'admin'
  | 'team_member'
  | 'talent_management'
  | 'talent_performer'
  | 'talent_crew'
  | 'vendor'
  | 'client'
  | 'sponsor'
  | 'industry_guest';

export type ProjectType =
  | 'talent_advance'
  | 'production_advance'
  | 'hybrid';

export type ProjectStatus =
  | 'draft'
  | 'active'
  | 'completed'
  | 'archived';

export type DeliverableType =
  /* Talent (6) */
  | 'technical_rider'
  | 'hospitality_rider'
  | 'input_list'
  | 'stage_plot'
  | 'crew_list'
  | 'guest_list'
  /* Production (9) */
  | 'equipment_pull_list'
  | 'power_plan'
  | 'rigging_plan'
  | 'site_plan'
  | 'build_schedule'
  | 'vendor_package'
  | 'safety_compliance'
  | 'comms_plan'
  | 'signage_grid'
  /* Custom */
  | 'custom';

export type DeliverableStatus =
  | 'draft'
  | 'submitted'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'revision_requested';

export type AllocationState =
  | 'reserved'
  | 'confirmed'
  | 'in_transit'
  | 'on_site'
  | 'returned'
  | 'maintenance';

export type CateringAllocationStatus =
  | 'allocated'
  | 'confirmed'
  | 'checked_in';

export type NotificationChannel =
  | 'email'
  | 'sms';

export type PortalTrack =
  | 'artist'
  | 'production'
  | 'sponsor'
  | 'guest'
  | 'client';

/* ─── Table Types ─── */

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: PlatformRole;
  created_at: string;
}

export interface Project {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  type: ProjectType;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  venue: {
    name: string;
    address: string;
    city: string;
    state: string;
    capacity: number;
    indoor_outdoor: string;
  } | null;
  features: string[];
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: PlatformRole;
  invited_by: string | null;
  created_at: string;
}

export interface Space {
  id: string;
  project_id: string;
  name: string;
  type: string;
  capacity: number | null;
  backline: Record<string, unknown> | null;
  created_at: string;
}

export interface Act {
  id: string;
  project_id: string;
  space_id: string | null;
  name: string;
  artist_name: string;
  set_time_start: string | null;
  set_time_end: string | null;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AdvanceCategoryGroup {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
}

export interface AdvanceCategory {
  id: string;
  group_id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
}

export interface AdvanceSubcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
}

export interface AdvanceItem {
  id: string;
  subcategory_id: string;
  name: string;
  slug: string;
  description: string | null;
  manufacturer: string | null;
  model: string | null;
  sku: string | null;
  unit: string;
  weight_kg: number | null;
  power_watts: number | null;
  daily_rate: number | null;
  weekly_rate: number | null;
  purchase_price: number | null;
  visibility_tags: string[];
  specifications: Record<string, unknown>;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CatalogItemInterchange {
  id: string;
  item_a_id: string;
  item_b_id: string;
  compatibility_score: number;
  relationship_type: string;
  notes: string | null;
}

export interface CatalogItemSupersession {
  id: string;
  discontinued_item_id: string;
  replacement_item_id: string;
  effective_date: string;
  notes: string | null;
}

export interface CatalogItemFitment {
  id: string;
  item_id: string;
  venue_type: string[];
  weather: string[];
  min_capacity: number | null;
  max_capacity: number | null;
  budget_tier: string | null;
  power_phase: string | null;
  indoor_outdoor: string[];
  event_type: string[];
  certification: string[];
  weight_class: string | null;
}

export interface CatalogItemInventory {
  id: string;
  item_id: string;
  quantity_owned: number;
  quantity_available: number;
  warehouse_location: string | null;
  updated_at: string;
}

export interface CatalogItemAllocation {
  id: string;
  item_id: string;
  project_id: string;
  space_id: string | null;
  quantity: number;
  state: AllocationState;
  notes: string | null;
  allocated_by: string;
  created_at: string;
  updated_at: string;
}

export interface Deliverable {
  id: string;
  project_id: string;
  act_id: string | null;
  type: DeliverableType;
  status: DeliverableStatus;
  data: Record<string, unknown>;
  version: number;
  submitted_by: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeliverableComment {
  id: string;
  deliverable_id: string;
  user_id: string;
  body: string;
  created_at: string;
}

export interface DeliverableHistory {
  id: string;
  deliverable_id: string;
  version: number;
  data: Record<string, unknown>;
  changed_by: string;
  changed_at: string;
}

export interface CateringMealPlan {
  id: string;
  project_id: string;
  meal_name: string;
  date: string;
  time: string;
  location: string;
  capacity: number;
  dietary_options: Record<string, unknown>;
  created_at: string;
}

export interface CateringAllocation {
  id: string;
  meal_plan_id: string;
  group_type: string;
  group_id: string | null;
  quantity: number;
  dietary_requirements: Record<string, unknown>;
  status: CateringAllocationStatus;
  created_at: string;
}

export interface CateringCheckIn {
  id: string;
  allocation_id: string;
  checked_in_at: string;
  checked_in_by: string;
}

export interface NotificationTemplate {
  id: string;
  project_id: string | null;
  channel: NotificationChannel;
  subject: string;
  body_template: string;
  trigger_event: string | null;
  created_at: string;
}

export interface NotificationLog {
  id: string;
  recipient_id: string;
  channel: NotificationChannel;
  template_id: string | null;
  sent_at: string;
  delivery_status: string;
  metadata: Record<string, unknown>;
}

export interface CmsPage {
  id: string;
  project_id: string;
  track: PortalTrack;
  slug: string;
  title: string;
  blocks: Record<string, unknown>[];
  visibility_tags: string[];
  published: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface CmsRevision {
  id: string;
  page_id: string;
  version: number;
  blocks: Record<string, unknown>[];
  edited_by: string;
  edited_at: string;
}

export interface ProjectTemplate {
  id: string;
  organization_id: string | null;
  name: string;
  description: string | null;
  config: Record<string, unknown>;
  features: string[];
  created_by: string;
  created_at: string;
}

export interface SubmissionTemplate {
  id: string;
  organization_id: string | null;
  deliverable_type: DeliverableType;
  name: string;
  schema: Record<string, unknown>;
  defaults: Record<string, unknown>;
  scope: 'personal' | 'org' | 'global';
  created_by: string;
  created_at: string;
}

/* ─── Role Helpers ─── */

export const INTERNAL_ROLES: PlatformRole[] = [
  'developer', 'owner', 'admin', 'team_member',
];

export const TALENT_ROLES: PlatformRole[] = [
  'talent_management', 'talent_performer', 'talent_crew',
];

export const PRODUCTION_ROLES: PlatformRole[] = [
  'vendor', 'client',
];

export const ALL_ROLES: PlatformRole[] = [
  ...INTERNAL_ROLES, ...TALENT_ROLES, ...PRODUCTION_ROLES,
  'sponsor', 'industry_guest',
];

export function isTalentRole(role: PlatformRole): boolean {
  return TALENT_ROLES.includes(role);
}

export function isInternalRole(role: PlatformRole): boolean {
  return INTERNAL_ROLES.includes(role);
}

export function canSeeFullCatalog(role: PlatformRole): boolean {
  return isInternalRole(role) || PRODUCTION_ROLES.includes(role);
}
