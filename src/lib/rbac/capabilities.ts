/* ═══════════════════════════════════════════════════════
   RBAC Capabilities Module
   Implements the 10+12+4 role/tier model from the IA spec §8.
   
   Platform roles (10): org-scoped, internal
   Project roles (12): project-scoped, maps to portal personas
   Tiers (4): feature gating per org subscription
   
   Enforcement layers (defense in depth):
   1. Middleware  — shell-level route guard
   2. Layout     — server component role+tier nav gating
   3. API route  — withAuth + can() capability check
   4. Database   — Supabase RLS on org_id, project_id, role
   ═══════════════════════════════════════════════════════ */

import type { PlatformRole, ProjectRole } from '@/lib/supabase/types';

/* ─── Tier Model ─── */

export type OrgTier = 'portal' | 'starter' | 'professional' | 'enterprise';

export const ORG_TIERS: OrgTier[] = ['portal', 'starter', 'professional', 'enterprise'];

/** Tier hierarchy — higher index = more features */
const TIER_RANK: Record<OrgTier, number> = {
  portal: 0,
  starter: 1,
  professional: 2,
  enterprise: 3,
};

export function tierAtLeast(current: OrgTier, required: OrgTier): boolean {
  return TIER_RANK[current] >= TIER_RANK[required];
}

/* ─── Capability Definitions ─── */

export type Capability =
  // Work
  | 'projects:read' | 'projects:create' | 'projects:update' | 'projects:delete'
  | 'tasks:read' | 'tasks:create' | 'tasks:update'
  | 'schedule:read' | 'schedule:manage'
  | 'locations:read' | 'locations:manage'
  // Sales & CRM
  | 'pipeline:read' | 'pipeline:manage'
  | 'leads:read' | 'leads:manage'
  | 'clients:read' | 'clients:manage'
  | 'proposals:read' | 'proposals:manage'
  | 'campaigns:read' | 'campaigns:manage'
  // Finance
  | 'invoices:read' | 'invoices:create' | 'invoices:approve'
  | 'expenses:read' | 'expenses:create' | 'expenses:approve'
  | 'budgets:read' | 'budgets:manage'
  | 'time:read' | 'time:submit' | 'time:approve'
  | 'advances:read' | 'advances:request' | 'advances:approve'
  | 'payouts:manage'
  | 'finance:reports'
  // Procurement
  | 'requisitions:read' | 'requisitions:create' | 'requisitions:approve'
  | 'purchase_orders:read' | 'purchase_orders:create' | 'purchase_orders:approve'
  | 'vendors:read' | 'vendors:manage'
  | 'rfqs:read' | 'rfqs:manage'
  | 'catalog:read' | 'catalog:manage'
  // Production
  | 'fabrication:read' | 'fabrication:manage'
  | 'dispatch:read' | 'dispatch:manage'
  | 'rentals:read' | 'rentals:manage'
  | 'equipment:read' | 'equipment:manage'
  | 'warehouse:read' | 'warehouse:manage'
  | 'logistics:read' | 'logistics:manage'
  // People
  | 'people:read' | 'people:manage'
  | 'crew:read' | 'crew:manage'
  | 'credentials:read' | 'credentials:manage'
  | 'roles:read' | 'roles:manage'
  | 'invites:manage'
  // AI
  | 'ai:assistant' | 'ai:drafting' | 'ai:automations' | 'ai:agents'
  // Collaboration
  | 'inbox:read' | 'files:read' | 'forms:manage'
  // Admin
  | 'settings:read' | 'settings:manage'
  | 'billing:manage'
  | 'integrations:manage'
  | 'api:manage'
  | 'webhooks:manage'
  | 'audit:read'
  | 'compliance:manage'
  | 'branding:manage'
  | 'domains:manage';

/* ─── Platform Role → Capability Map ─── */

/** Full access — every capability */
const ALL_CAPABILITIES: Capability[] = [
  'projects:read', 'projects:create', 'projects:update', 'projects:delete',
  'tasks:read', 'tasks:create', 'tasks:update',
  'schedule:read', 'schedule:manage',
  'locations:read', 'locations:manage',
  'pipeline:read', 'pipeline:manage',
  'leads:read', 'leads:manage',
  'clients:read', 'clients:manage',
  'proposals:read', 'proposals:manage',
  'campaigns:read', 'campaigns:manage',
  'invoices:read', 'invoices:create', 'invoices:approve',
  'expenses:read', 'expenses:create', 'expenses:approve',
  'budgets:read', 'budgets:manage',
  'time:read', 'time:submit', 'time:approve',
  'advances:read', 'advances:request', 'advances:approve',
  'payouts:manage', 'finance:reports',
  'requisitions:read', 'requisitions:create', 'requisitions:approve',
  'purchase_orders:read', 'purchase_orders:create', 'purchase_orders:approve',
  'vendors:read', 'vendors:manage',
  'rfqs:read', 'rfqs:manage',
  'catalog:read', 'catalog:manage',
  'fabrication:read', 'fabrication:manage',
  'dispatch:read', 'dispatch:manage',
  'rentals:read', 'rentals:manage',
  'equipment:read', 'equipment:manage',
  'warehouse:read', 'warehouse:manage',
  'logistics:read', 'logistics:manage',
  'people:read', 'people:manage',
  'crew:read', 'crew:manage',
  'credentials:read', 'credentials:manage',
  'roles:read', 'roles:manage',
  'invites:manage',
  'ai:assistant', 'ai:drafting', 'ai:automations', 'ai:agents',
  'inbox:read', 'files:read', 'forms:manage',
  'settings:read', 'settings:manage',
  'billing:manage', 'integrations:manage',
  'api:manage', 'webhooks:manage',
  'audit:read', 'compliance:manage',
  'branding:manage', 'domains:manage',
];

const PLATFORM_ROLE_CAPABILITIES: Record<string, Capability[]> = {
  developer: ALL_CAPABILITIES,
  owner: ALL_CAPABILITIES,
  admin: ALL_CAPABILITIES.filter(c => c !== 'billing:manage'), // billing is owner-only
  controller: [
    'projects:read',
    'invoices:read', 'invoices:create', 'invoices:approve',
    'expenses:read', 'expenses:create', 'expenses:approve',
    'budgets:read', 'budgets:manage',
    'time:read', 'time:approve',
    'advances:read', 'advances:approve',
    'payouts:manage', 'finance:reports',
    'requisitions:read', 'requisitions:approve',
    'purchase_orders:read', 'purchase_orders:approve',
    'vendors:read', 'vendors:manage',
    'catalog:read',
  ],
  team_member: [
    'projects:read', 'projects:create', 'projects:update',
    'tasks:read', 'tasks:create', 'tasks:update',
    'schedule:read', 'schedule:manage',
    'locations:read', 'locations:manage',
    'pipeline:read', 'pipeline:manage',
    'leads:read', 'leads:manage',
    'clients:read', 'clients:manage',
    'proposals:read', 'proposals:manage',
    'campaigns:read', 'campaigns:manage',
    'invoices:read', 'invoices:create',
    'expenses:read', 'expenses:create',
    'budgets:read',
    'time:read', 'time:submit',
    'advances:read', 'advances:request',
    'requisitions:read', 'requisitions:create',
    'purchase_orders:read', 'purchase_orders:create',
    'vendors:read',
    'rfqs:read', 'rfqs:manage',
    'catalog:read',
    'fabrication:read', 'fabrication:manage',
    'dispatch:read', 'dispatch:manage',
    'rentals:read', 'rentals:manage',
    'equipment:read', 'equipment:manage',
    'warehouse:read', 'warehouse:manage',
    'logistics:read', 'logistics:manage',
    'people:read',
    'crew:read', 'crew:manage',
    'credentials:read', 'credentials:manage',
    'ai:assistant', 'ai:drafting',
    'inbox:read', 'files:read', 'forms:manage',
    'settings:read',
  ],
  collaborator: [
    'projects:read', 'projects:update',
    'tasks:read', 'tasks:create', 'tasks:update',
    'schedule:read',
    'locations:read',
    'time:read', 'time:submit',
    'expenses:read', 'expenses:create',
    'catalog:read',
    'equipment:read',
    'crew:read',
    'credentials:read',
    'ai:assistant',
    'inbox:read', 'files:read',
  ],
  contractor: [
    'projects:read',
    'tasks:read', 'tasks:update',
    'schedule:read',
    'time:read', 'time:submit',
    'advances:read', 'advances:request',
    'credentials:read',
    'inbox:read',
  ],
  crew: [
    'projects:read',
    'tasks:read',
    'schedule:read',
    'time:read', 'time:submit',
    'credentials:read',
  ],
  client: [
    'projects:read',
    'proposals:read',
    'invoices:read',
    'files:read',
  ],
  viewer: [
    'projects:read',
    'schedule:read',
  ],
  community: [] as Capability[],
};

/* ─── Capability Check ─── */

interface CanContext {
  orgId?: string;
  projectId?: string;
}

/**
 * Check if a user with the given platform role has a capability.
 * 
 * Usage:
 *   if (!can(user.platformRole, 'invoices:create')) {
 *     return apiForbidden();
 *   }
 */
export function can(role: PlatformRole | string, capability: Capability, _ctx?: CanContext): boolean {
  const caps = PLATFORM_ROLE_CAPABILITIES[role];
  if (!caps) return false;
  return caps.includes(capability);
}

/**
 * Check if a user has any of the given capabilities.
 */
export function canAny(role: PlatformRole | string, capabilities: Capability[]): boolean {
  return capabilities.some(c => can(role, c));
}

/**
 * Get all capabilities for a role.
 */
export function getCapabilities(role: PlatformRole | string): Capability[] {
  return PLATFORM_ROLE_CAPABILITIES[role] ?? [];
}

/* ─── Sidebar Section Gating ─── */

export type SidebarSection =
  | 'dashboard' | 'work' | 'sales' | 'finance'
  | 'procurement' | 'production' | 'people'
  | 'ai' | 'collaboration' | 'settings';

/** Minimum tier required to see each sidebar section */
const SECTION_MIN_TIER: Record<SidebarSection, OrgTier> = {
  dashboard: 'portal',
  work: 'portal',
  sales: 'starter',
  finance: 'starter',
  procurement: 'professional',
  production: 'professional',
  people: 'starter',
  ai: 'professional',
  collaboration: 'starter',
  settings: 'portal',
};

/** Capabilities required to see each sidebar section (need at least one) */
const SECTION_REQUIRED_CAPS: Record<SidebarSection, Capability[]> = {
  dashboard: ['projects:read'],
  work: ['projects:read', 'tasks:read', 'schedule:read'],
  sales: ['pipeline:read', 'leads:read', 'clients:read', 'proposals:read'],
  finance: ['invoices:read', 'expenses:read', 'budgets:read', 'finance:reports'],
  procurement: ['requisitions:read', 'purchase_orders:read', 'vendors:read'],
  production: ['fabrication:read', 'dispatch:read', 'equipment:read', 'logistics:read'],
  people: ['people:read', 'crew:read'],
  ai: ['ai:assistant', 'ai:drafting', 'ai:automations'],
  collaboration: ['inbox:read', 'files:read', 'forms:manage'],
  settings: ['settings:read', 'settings:manage'],
};

/**
 * Determine which sidebar sections a user should see,
 * based on their platform role and org tier.
 */
export function getVisibleSections(
  role: PlatformRole | string,
  tier: OrgTier = 'professional',
): SidebarSection[] {
  return (Object.keys(SECTION_MIN_TIER) as SidebarSection[]).filter((section) => {
    // Tier gate
    if (!tierAtLeast(tier, SECTION_MIN_TIER[section])) return false;
    // Role gate
    const requiredCaps = SECTION_REQUIRED_CAPS[section];
    if (requiredCaps.length === 0) return true;
    return canAny(role, requiredCaps);
  });
}
