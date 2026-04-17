import Link from 'next/link';
import { Avatar } from '../ui/Avatar';
import { ThemeToggle } from '../ui/ThemeToggle';

/* ═══════════════════════════════════════════════════════
   Sidebar — Canonical console navigation sidebar
   Implements §5.1 from the IA spec: grouped, collapsible
   navigation with role + tier gating.
   ═══════════════════════════════════════════════════════ */

interface NavItem {
  href: string;
  label: string;
}

interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

/**
 * Canonical sidebar sections per §5.1 of the IA spec.
 * Group visibility is tier- and role-gated via the RBAC module.
 */
const NAV_SECTIONS: NavSection[] = [
  {
    id: 'dashboard',
    label: '',
    items: [
      { href: '/me', label: 'Universal Hub' },
      { href: '/console', label: 'Dashboard' },
      { href: '/console/command', label: 'Command Palette' },
    ],
  },
  {
    id: 'work',
    label: 'Work',
    items: [
      { href: '/console/projects', label: 'Projects' },
      { href: '/console/tasks', label: 'Tasks' },
      { href: '/console/schedule', label: 'Schedule' },
      { href: '/console/locations', label: 'Locations' },
    ],
  },
  {
    id: 'sales',
    label: 'Sales & CRM',
    items: [
      { href: '/console/pipeline', label: 'Pipeline' },
      { href: '/console/leads', label: 'Leads' },
      { href: '/console/clients', label: 'Clients' },
      { href: '/console/proposals', label: 'Proposals' },
      { href: '/console/campaigns', label: 'Campaigns' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    items: [
      { href: '/console/finance', label: 'Finance Hub' },
      { href: '/console/finance/invoices', label: 'Invoices' },
      { href: '/console/finance/expenses', label: 'Expenses' },
      { href: '/console/finance/budgets', label: 'Budgets' },
      { href: '/console/finance/time', label: 'Time' },
      { href: '/console/finance/mileage', label: 'Mileage' },
      { href: '/console/finance/advances', label: 'Advances' },
      { href: '/console/finance/reports', label: 'Reports' },
    ],
  },
  {
    id: 'procurement',
    label: 'Procurement',
    items: [
      { href: '/console/procurement', label: 'Procurement Hub' },
      { href: '/console/procurement/requisitions', label: 'Requisitions' },
      { href: '/console/procurement/purchase-orders', label: 'Purchase Orders' },
      { href: '/console/procurement/vendors', label: 'Vendors' },
      { href: '/console/procurement/rfqs', label: 'RFQs' },
      { href: '/console/procurement/catalog', label: 'Catalog' },
    ],
  },
  {
    id: 'production',
    label: 'Production',
    items: [
      { href: '/console/production/fabrication', label: 'Fabrication' },
      { href: '/console/production/dispatch', label: 'Dispatch' },
      { href: '/console/production/rentals', label: 'Rentals' },
      { href: '/console/production/equipment', label: 'Equipment' },
      { href: '/console/production/warehouse', label: 'Warehouse' },
      { href: '/console/production/logistics', label: 'Logistics' },
    ],
  },
  {
    id: 'people',
    label: 'People',
    items: [
      { href: '/console/people', label: 'Directory' },
      { href: '/console/people/crew', label: 'Crew' },
      { href: '/console/people/credentials', label: 'Credentials' },
      { href: '/console/people/roles', label: 'Roles' },
    ],
  },
  {
    id: 'ai',
    label: 'AI & Automation',
    items: [
      { href: '/console/ai', label: 'AI Hub' },
      { href: '/console/ai/drafting', label: 'Drafting' },
      { href: '/console/ai/automations', label: 'Automations' },
      { href: '/console/ai/agents', label: 'Agents' },
    ],
  },
  {
    id: 'collaboration',
    label: 'Collaboration',
    items: [
      { href: '/console/inbox', label: 'Inbox' },
      { href: '/console/files', label: 'Files' },
      { href: '/console/forms', label: 'Forms' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    items: [
      { href: '/console/settings', label: 'Settings Hub' },
      { href: '/console/settings/organization', label: 'Organization' },
      { href: '/console/settings/billing', label: 'Billing' },
      { href: '/console/settings/integrations', label: 'Integrations' },
      { href: '/console/settings/api', label: 'API' },
      { href: '/console/settings/audit', label: 'Audit Log' },
      { href: '/console/settings/branding', label: 'Branding' },
    ],
  },
];

interface SidebarProps {
  /** Current user email for avatar display */
  userEmail?: string | null;
  /** Current path for active state */
  currentPath?: string;
  /** Sections to show (from RBAC getVisibleSections). Shows all if omitted. */
  visibleSections?: string[];
}

export function Sidebar({ userEmail, currentPath, visibleSections }: SidebarProps) {
  const sections = visibleSections
    ? NAV_SECTIONS.filter((s) => s.id === 'dashboard' || visibleSections.includes(s.id))
    : NAV_SECTIONS;

  return (
    <aside data-platform="atlvs" className="w-64 border-r border-border bg-surface flex flex-col shrink-0">
      {/* Brand */}
      <div className="p-6 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--brand-color)] [box-shadow:var(--brand-shadow)]" />
          <span className="text-heading text-sm tracking-[0.2em] text-text-primary">ATLVS</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
        {sections.map((section, i) => (
          <div key={section.id || `nav-${i}`}>
            {section.label && (
              <div className="text-label text-text-disabled mt-6 mb-2 px-3 first:mt-0">
                {section.label}
              </div>
            )}
            {section.items.map((item) => {
              const isActive = currentPath === item.href ||
                (item.href !== '/console' && item.href !== '/me' && currentPath?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={isActive ? 'nav-item nav-item-active' : 'nav-item'}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-border-subtle">
        <div className="flex items-center gap-3">
          <Avatar name={userEmail} size="md" />
          <div className="flex-1 min-w-0">
            <div className="text-xs text-text-primary truncate">
              {userEmail || 'Not signed in'}
            </div>
            <div className="text-label text-text-disabled text-[0.5rem]">DEVELOPER</div>
          </div>
        </div>
        <div className="mt-4 mb-2 flex justify-center">
          <ThemeToggle />
        </div>
        <form action="/api/auth/signout" method="POST" className="mt-1">
          <button
            type="submit"
            className="btn btn-ghost w-full text-xs py-1.5 text-text-tertiary hover:text-red-400"
          >
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}
