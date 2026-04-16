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
export type ProjectType = Database['public']['Enums']['project_type'];
export type ProjectStatus = Database['public']['Enums']['project_status'];
export type DeliverableType = Database['public']['Enums']['deliverable_type'];
export type DeliverableStatus = Database['public']['Enums']['deliverable_status'];
export type AllocationState = Database['public']['Enums']['allocation_state'];
export type CateringAllocationStatus = Database['public']['Enums']['catering_alloc_status'];
export type NotificationChannel = Database['public']['Enums']['notification_channel'];
export type PortalTrack = Database['public']['Enums']['portal_track'];

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
