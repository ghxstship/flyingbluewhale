import { z } from 'zod';

// Shared
export const uuidSchema = z.string().uuid();

// Projects
export const projectCreateSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  type: z.enum(['talent_advance', 'production_advance', 'hybrid']),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  description: z.string().max(1000).optional(),
});

export const projectUpdateSchema = projectCreateSchema.partial();

// Credentials
export const credentialOrderSchema = z.object({
  project_id: uuidSchema,
  credential_type_id: uuidSchema,
  group_name: z.string().min(1),
  quantity: z.number().int().min(1).default(1),
  notes: z.string().optional(),
});

export const credentialTransitionSchema = z.object({
  status: z.enum(['approved', 'denied', 'issued', 'picked_up', 'revoked']),
  notes: z.string().optional(),
});

const baseDeliverable = z.object({
  project_id: uuidSchema,
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  assignee_id: uuidSchema.optional(),
  due_date: z.string().datetime().optional(),
});

export const deliverableCreateSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('technical_rider'), data: z.object({ equipment_requirements: z.array(uuidSchema).optional(), backline_provided: z.boolean().optional() }) }).merge(baseDeliverable),
  z.object({ type: z.literal('hospitality_rider'), data: z.object({ dietary_restrictions: z.array(z.string()).optional(), hotel_needs: z.boolean().optional() }) }).merge(baseDeliverable),
  z.object({ type: z.literal('safety_compliance'), data: z.object({ insurance_url: z.string().url().optional(), expiration_date: z.string().optional() }) }).merge(baseDeliverable),
  z.object({ type: z.literal('guest_list'), data: z.object({ ga_count: z.number().int().min(0).optional(), vip_count: z.number().int().min(0).optional() }) }).merge(baseDeliverable),
  ...[
    'input_list', 'stage_plot', 'crew_list', 'equipment_pull_list', 'power_plan', 
    'rigging_plan', 'site_plan', 'build_schedule', 'vendor_package', 'comms_plan', 
    'signage_grid', 'custom'
  ].map(t => z.object({ type: z.literal(t as any), data: z.record(z.string(), z.any()).optional() }).merge(baseDeliverable))
]);

export const deliverableUpdateSchema = z.object({
  status: z.enum(['draft', 'submitted', 'in_review', 'approved', 'rejected', 'revision_requested']),
  comment: z.string().optional(),
  data: z.record(z.string(), z.any()).optional(),
});

// Allocations
export const allocationCreateSchema = z.object({
  project_id: uuidSchema,
  catalog_item_id: uuidSchema,
  quantity: z.number().int().min(1),
  location_id: uuidSchema.optional(),
  required_by: z.string().datetime().optional(),
});

export const allocationTransitionSchema = z.object({
  state: z.enum(['reserved', 'confirmed', 'in_transit', 'on_site', 'returned', 'maintenance']),
  notes: z.string().optional(),
});

// Catering
export const cateringMealPlanSchema = z.object({
  project_id: uuidSchema,
  name: z.string().min(1),
  meal_date: z.string(), // YYYY-MM-DD
  headcount: z.number().int().min(1),
});

export const cateringScanSchema = z.object({
  allocation_id: uuidSchema,
  station_id: uuidSchema.optional(),
});

// Check-in
export const checkInScanSchema = z.object({
  asset_code: z.string().min(3),
  location_id: uuidSchema.optional(),
});

// Notifications
export const notificationSendSchema = z.object({
  project_id: uuidSchema,
  recipients: z.array(uuidSchema),
  template: z.string(),
  channel: z.enum(['email', 'sms', 'in_app']),
  payload: z.record(z.string(), z.any()).optional(),
});

// Locations
export const locationCreateSchema = z.object({
  organization_id: uuidSchema.optional(),
  project_id: uuidSchema.optional(),
  parent_id: uuidSchema.optional(),
  name: z.string().min(1),
  type: z.enum(['warehouse', 'site', 'dock', 'stage', 'storage', 'vehicle', 'vendor', 'venue', 'office', 'room', 'gate', 'zone', 'loading_bay', 'parking', 'green_room', 'production_office', 'kitchen', 'bar', 'dining', 'performance', 'backstage', 'other']).optional(),
  address: z.record(z.string(), z.any()).optional(),
  capacity: z.record(z.string(), z.any()).optional(),
  contact: z.record(z.string(), z.any()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const locationUpdateSchema = locationCreateSchema.extend({
  id: uuidSchema,
  is_active: z.boolean().optional(),
}).partial();

// Master Schedule
export const scheduleEntryCreateSchema = z.object({
  project_id: uuidSchema,
  title: z.string().min(1),
  subtitle: z.string().optional(),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime().optional(),
  all_day: z.boolean().optional(),
  category: z.string(),
  icon: z.string().optional(),
  color: z.string().optional(),
  location_id: uuidSchema.optional(),
  space_id: uuidSchema.optional(),
  assigned_to: uuidSchema.optional(),
  priority: z.string().optional(),
  visibility: z.array(z.string()).optional(),
  rrule: z.string().optional(),
  rrule_until: z.string().datetime().optional(),
  occurrences: z.array(z.string().datetime()).optional(), // specific ISO timestamps for initial payload
  reminders: z.array(z.object({
    lead_minutes: z.number(),
    channel: z.string(),
    recipient_id: uuidSchema.optional(),
  })).optional()
});

export const scheduleEntryUpdateSchema = scheduleEntryCreateSchema.omit({ project_id: true, occurrences: true, reminders: true }).extend({
  id: uuidSchema,
  status: z.string().optional(),
  is_cancelled: z.boolean().optional(),
}).partial();

// Entity Asset Links
export const entityAssetLinkSchema = z.object({
  project_id: uuidSchema,
  source_type: z.string().min(1),
  source_id: uuidSchema,
  item_id: uuidSchema,
  quantity: z.number().int().min(1).optional(),
  link_type: z.string().optional(),
  allocation_id: uuidSchema.optional(),
  asset_instance_id: uuidSchema.optional(),
  notes: z.string().optional()
});

// Shipments
export const shipmentEventSchema = z.object({
  shipment_id: uuidSchema,
  status: z.string(),
  location: z.string().optional(),
  notes: z.string().optional(),
  event_time: z.string().datetime().optional()
});

