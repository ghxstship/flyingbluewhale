#!/usr/bin/env node
/**
 * IA Merge Scaffold — generates all stub pages for the canonical IA.
 * Run: node scripts/scaffold_ia.js
 */
const fs = require('fs');
const path = require('path');

const APP = path.join(__dirname, '..', 'src', 'app');

function writePageIfMissing(relPath, content) {
  const full = path.join(APP, relPath);
  const dir = path.dirname(full);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (fs.existsSync(full)) {
    console.log(`  SKIP ${relPath}`);
    return;
  }
  fs.writeFileSync(full, content, 'utf8');
  console.log(`  CREATE ${relPath}`);
}

function stubPage(title, description = '') {
  const desc = description || `${title} module`;
  return `export const metadata = { title: '${title}' };

export default function ${title.replace(/[^a-zA-Z0-9]/g, '')}Page() {
  return (
    <div className="p-8">
      <h1 className="text-heading text-2xl text-text-primary mb-2">${title}</h1>
      <p className="text-text-secondary text-sm">${desc}</p>
    </div>
  );
}
`;
}

function stubAuthPage(title, description) {
  return `export const metadata = { title: '${title}' };

export default function ${title.replace(/[^a-zA-Z0-9]/g, '')}Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 bg-surface border border-border rounded-xl">
        <h1 className="text-heading text-xl text-text-primary mb-2 text-center">${title}</h1>
        <p className="text-text-secondary text-sm text-center mb-6">${description}</p>
        <div className="space-y-4">
          <div className="h-10 rounded-lg bg-surface-hover animate-pulse" />
          <div className="h-10 rounded-lg bg-surface-hover animate-pulse" />
        </div>
      </div>
    </div>
  );
}
`;
}

// ═══════════════════════════════════════════
// Phase 2: Auth Shell Expansion
// ═══════════════════════════════════════════
console.log('\n📋 Phase 2: Auth Shell Expansion');

writePageIfMissing('(auth)/forgot-password/page.tsx',
  stubAuthPage('Forgot Password', 'Enter your email to receive a password reset link.'));

writePageIfMissing('(auth)/reset-password/[token]/page.tsx',
  stubAuthPage('Reset Password', 'Choose a new password for your account.'));

writePageIfMissing('(auth)/verify-email/[token]/page.tsx',
  stubAuthPage('Verify Email', 'Confirming your email address…'));

writePageIfMissing('(auth)/magic-link/[token]/page.tsx',
  stubAuthPage('Magic Link', 'Signing you in…'));

writePageIfMissing('(auth)/accept-invite/[token]/page.tsx',
  stubAuthPage('Accept Invite', 'You have been invited to join an organization.'));

writePageIfMissing('(auth)/sso/[provider]/page.tsx',
  stubAuthPage('Single Sign-On', 'Redirecting to your identity provider…'));

// ═══════════════════════════════════════════
// Phase 3: Personal Shell Buildout
// ═══════════════════════════════════════════
console.log('\n📋 Phase 3: Personal Shell Buildout');

writePageIfMissing('(personal)/me/profile/page.tsx',
  stubPage('Profile', 'Manage your identity, avatar, and contact information.'));

writePageIfMissing('(personal)/me/settings/page.tsx',
  stubPage('Settings', 'Preferences, timezone, and locale settings.'));

writePageIfMissing('(personal)/me/notifications/page.tsx',
  stubPage('Notifications', 'Configure notification preferences per channel.'));

writePageIfMissing('(personal)/me/security/page.tsx',
  stubPage('Security', 'Password, two-factor authentication, sessions, and API tokens.'));

writePageIfMissing('(personal)/me/tickets/page.tsx',
  stubPage('My Tickets', 'Tickets purchased, scanned, and transferred.'));

writePageIfMissing('(personal)/me/organizations/page.tsx',
  stubPage('Organizations', 'Organizations you belong to and org switcher.'));

// Personal layout
writePageIfMissing('(personal)/me/layout.tsx', `import Link from 'next/link';

const ME_NAV = [
  { href: '/me', label: 'Dashboard' },
  { href: '/me/profile', label: 'Profile' },
  { href: '/me/settings', label: 'Settings' },
  { href: '/me/notifications', label: 'Notifications' },
  { href: '/me/security', label: 'Security' },
  { href: '/me/tickets', label: 'Tickets' },
  { href: '/me/organizations', label: 'Organizations' },
];

export default function PersonalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-56 border-r border-border bg-surface p-4 shrink-0 hidden md:block">
        <div className="mb-6">
          <span className="text-heading text-xs tracking-[0.2em] text-text-disabled">PERSONAL</span>
        </div>
        <nav className="flex flex-col gap-1">
          {ME_NAV.map((item) => (
            <Link key={item.href} href={item.href} className="nav-item text-sm">
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
`);

// ═══════════════════════════════════════════
// Phase 4: Console Module Reorganization
// ═══════════════════════════════════════════
console.log('\n📋 Phase 4: Console Module Reorganization');

// 4A: Finance extras
writePageIfMissing('(platform)/console/finance/mileage/(hub)/page.tsx',
  stubPage('Mileage', 'Track and reimburse mileage expenses.'));
writePageIfMissing('(platform)/console/finance/advances/(hub)/page.tsx',
  stubPage('Advances', 'Per-diem and advance requests.'));
writePageIfMissing('(platform)/console/finance/payouts/page.tsx',
  stubPage('Payouts', 'Stripe Connect payout management.'));

// 4B: Procurement hub + new pages
writePageIfMissing('(platform)/console/procurement/page.tsx',
  stubPage('Procurement', 'Requisitions, purchase orders, vendors, and RFQs.'));
writePageIfMissing('(platform)/console/procurement/requisitions/(hub)/page.tsx',
  stubPage('Requisitions', 'Create and manage procurement requisitions.'));
writePageIfMissing('(platform)/console/procurement/rfqs/(hub)/page.tsx',
  stubPage('RFQs', 'Request for quotes from approved vendors.'));
writePageIfMissing('(platform)/console/procurement/catalog/page.tsx',
  stubPage('Approved Catalog', 'Browse and manage the approved item catalog.'));

// 4C: Production hub new pages
writePageIfMissing('(platform)/console/production/dispatch/(hub)/page.tsx',
  stubPage('Dispatch', 'Dispatch board and shipment tracking.'));
writePageIfMissing('(platform)/console/production/rentals/(hub)/page.tsx',
  stubPage('Rentals', 'Equipment rentals and availability tracking.'));
writePageIfMissing('(platform)/console/production/warehouse/(hub)/page.tsx',
  stubPage('Warehouse', 'Warehouse locations, stock moves, and inventory.'));

// 4D: People hub new pages
writePageIfMissing('(platform)/console/people/roles/page.tsx',
  stubPage('Role Matrix', 'Platform and project role assignments.'));
writePageIfMissing('(platform)/console/people/invites/page.tsx',
  stubPage('Pending Invites', 'Outstanding invitations to join the organization.'));

// 4F: AI hub
writePageIfMissing('(platform)/console/ai/page.tsx',
  stubPage('AI Hub', 'Assistant, document drafting, automations, and agents.'));
writePageIfMissing('(platform)/console/ai/assistant/[conversationId]/page.tsx', `export const metadata = { title: 'AI Assistant' };

export default async function AIAssistantPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  return (
    <div className="p-8">
      <h1 className="text-heading text-2xl text-text-primary mb-2">AI Assistant</h1>
      <p className="text-text-secondary text-sm">Conversation: {conversationId}</p>
    </div>
  );
}
`);
writePageIfMissing('(platform)/console/ai/drafting/page.tsx',
  stubPage('Document Drafting', 'AI-powered document drafting workspace.'));
writePageIfMissing('(platform)/console/ai/automations/(hub)/page.tsx',
  stubPage('Automations', 'Rule builder and automation templates.'));
writePageIfMissing('(platform)/console/ai/agents/page.tsx',
  stubPage('Agents', 'Long-running managed AI agents.'));

// 4G: Collaboration & Admin
writePageIfMissing('(platform)/console/inbox/page.tsx',
  stubPage('Inbox', 'Unified messages, mentions, and notifications.'));
writePageIfMissing('(platform)/console/files/page.tsx',
  stubPage('Files', 'Global file browser scoped by project.'));
writePageIfMissing('(platform)/console/forms/(hub)/page.tsx',
  stubPage('Forms', 'Public and private form builder.'));

// Settings sub-pages
writePageIfMissing('(platform)/console/settings/page.tsx',
  stubPage('Settings', 'Organization settings and administration.'));
writePageIfMissing('(platform)/console/settings/organization/page.tsx',
  stubPage('Organization', 'Organization profile and configuration.'));
writePageIfMissing('(platform)/console/settings/billing/page.tsx',
  stubPage('Billing', 'Subscription, payment methods, and invoices.'));
writePageIfMissing('(platform)/console/settings/integrations/(hub)/page.tsx',
  stubPage('Integrations', 'Connected services and marketplace.'));
writePageIfMissing('(platform)/console/settings/api/page.tsx',
  stubPage('API Settings', 'API keys, webhooks, and rate limits.'));
writePageIfMissing('(platform)/console/settings/webhooks/(hub)/page.tsx',
  stubPage('Webhooks', 'Webhook endpoints and delivery logs.'));
writePageIfMissing('(platform)/console/settings/branding/page.tsx',
  stubPage('Branding', 'Portal and email branding configuration.'));
writePageIfMissing('(platform)/console/settings/domains/page.tsx',
  stubPage('Custom Domains', 'Custom domains for external portals.'));

// ═══════════════════════════════════════════
// Phase 5: Portal Persona Expansion
// ═══════════════════════════════════════════
console.log('\n📋 Phase 5: Portal Persona Expansion');

// Portal overview
writePageIfMissing('(portal)/p/[slug]/overview/page.tsx', `export const metadata = { title: 'Portal Overview' };

export default async function PortalOverviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="p-8">
      <h1 className="text-heading text-2xl text-text-primary mb-2">Project Overview</h1>
      <p className="text-text-secondary text-sm">Summary for {slug}</p>
    </div>
  );
}
`);

// Vendor persona
writePageIfMissing('(portal)/p/[slug]/vendor/page.tsx',
  stubPage('Vendor Portal', 'Vendor workspace — submissions, orders, and invoices.'));
writePageIfMissing('(portal)/p/[slug]/vendor/submissions/page.tsx',
  stubPage('Submissions', 'Submit and track vendor deliverables.'));
writePageIfMissing('(portal)/p/[slug]/vendor/equipment-pull-list/page.tsx',
  stubPage('Equipment Pull List', 'Equipment allocated to this vendor.'));
writePageIfMissing('(portal)/p/[slug]/vendor/purchase-orders/page.tsx',
  stubPage('Purchase Orders', 'Purchase orders issued to you.'));
writePageIfMissing('(portal)/p/[slug]/vendor/invoices/page.tsx',
  stubPage('Invoices', 'Submit invoices and track payment status.'));
writePageIfMissing('(portal)/p/[slug]/vendor/credentials/page.tsx',
  stubPage('Credentials', 'Upload COI, W-9, licenses, and certifications.'));

// Crew persona
writePageIfMissing('(portal)/p/[slug]/crew/page.tsx',
  stubPage('Crew Portal', 'Crew workspace — call sheets, time tracking, and advances.'));
writePageIfMissing('(portal)/p/[slug]/crew/call-sheet/page.tsx',
  stubPage('Call Sheet', "Today's call sheet and schedule."));
writePageIfMissing('(portal)/p/[slug]/crew/time/page.tsx',
  stubPage('Time Tracking', 'Submit and review hours worked.'));
writePageIfMissing('(portal)/p/[slug]/crew/advances/page.tsx',
  stubPage('Advances', 'Request per-diem and advance payments.'));

// Artist extras
writePageIfMissing('(portal)/p/[slug]/artist/schedule/page.tsx',
  stubPage('Schedule', 'Day-of-show schedule and set times.'));
writePageIfMissing('(portal)/p/[slug]/artist/travel/page.tsx',
  stubPage('Travel', 'Flights, hotel, and ground transportation.'));

// Client extras
writePageIfMissing('(portal)/p/[slug]/client/proposals/page.tsx',
  stubPage('Proposals', 'Review, approve, and e-sign proposals.'));
writePageIfMissing('(portal)/p/[slug]/client/deliverables/page.tsx',
  stubPage('Deliverables', 'Track project deliverables and milestones.'));
writePageIfMissing('(portal)/p/[slug]/client/messages/page.tsx',
  stubPage('Messages', 'Direct communication with your project team.'));
writePageIfMissing('(portal)/p/[slug]/client/files/page.tsx',
  stubPage('Files', 'Shared project files and documents.'));
writePageIfMissing('(portal)/p/[slug]/client/invoices/page.tsx',
  stubPage('Invoices', 'View and pay outstanding invoices.'));

// Sponsor extras
writePageIfMissing('(portal)/p/[slug]/sponsor/activations/page.tsx',
  stubPage('Activations', 'Manage sponsor activation placements.'));
writePageIfMissing('(portal)/p/[slug]/sponsor/assets/page.tsx',
  stubPage('Brand Assets', 'Upload logos, brand guidelines, and media assets.'));
writePageIfMissing('(portal)/p/[slug]/sponsor/reporting/page.tsx',
  stubPage('Reporting', 'Sponsorship performance analytics and reports.'));

// Guest extras
writePageIfMissing('(portal)/p/[slug]/guest/tickets/page.tsx',
  stubPage('Tickets', 'Buy, claim, or transfer tickets.'));
writePageIfMissing('(portal)/p/[slug]/guest/schedule/page.tsx',
  stubPage('Schedule', 'Event schedule and set times.'));
writePageIfMissing('(portal)/p/[slug]/guest/logistics/page.tsx',
  stubPage('Logistics', 'Parking, entrances, and rideshare information.'));

// ═══════════════════════════════════════════
// Phase 6: Mobile PWA Shell
// ═══════════════════════════════════════════
console.log('\n📋 Phase 6: Mobile PWA Shell');

writePageIfMissing('(mobile)/m/check-in/page.tsx',
  stubPage('Check-In', 'Scan tickets and credentials for event entry.'));
writePageIfMissing('(mobile)/m/check-in/scan/[slug]/page.tsx', `'use client';
export default function ScanPage() {
  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-64 h-64 border-2 border-dashed border-border rounded-2xl flex items-center justify-center mb-4">
        <span className="text-4xl">📷</span>
      </div>
      <h1 className="text-heading text-lg text-text-primary mb-1">Scan QR Code</h1>
      <p className="text-text-secondary text-sm">Point camera at ticket or credential QR code</p>
    </div>
  );
}
`);
writePageIfMissing('(mobile)/m/check-in/manual/page.tsx',
  stubPage('Manual Lookup', 'Look up tickets by name, email, or confirmation number.'));
writePageIfMissing('(mobile)/m/crew/page.tsx',
  stubPage('Crew', "Today's call sheet and assignments."));
writePageIfMissing('(mobile)/m/crew/clock/page.tsx', `'use client';
export default function ClockPage() {
  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="text-6xl mb-4">⏱️</div>
      <h1 className="text-heading text-lg text-text-primary mb-2">Clock In / Out</h1>
      <p className="text-text-secondary text-sm mb-6">Geo-verified time tracking</p>
      <button className="btn btn-primary w-full max-w-xs py-3 text-base">Clock In</button>
    </div>
  );
}
`);
writePageIfMissing('(mobile)/m/tasks/page.tsx',
  stubPage('Tasks', 'Your assigned tasks (offline queue supported).'));
writePageIfMissing('(mobile)/m/inventory/scan/page.tsx',
  stubPage('Inventory Scan', 'Scan equipment in and out.'));
writePageIfMissing('(mobile)/m/incidents/new/page.tsx',
  stubPage('Report Incident', 'Submit an incident or safety report.'));
writePageIfMissing('(mobile)/m/settings/page.tsx',
  stubPage('Settings', 'Offline sync, camera permissions, and preferences.'));

// ═══════════════════════════════════════════
// Phase 8: Marketing Shell
// ═══════════════════════════════════════════
console.log('\n📋 Phase 8: Marketing Shell');

writePageIfMissing('(marketing)/pricing/page.tsx',
  stubPage('Pricing', 'Portal · Starter · Professional · Enterprise'));
writePageIfMissing('(marketing)/features/page.tsx',
  stubPage('Features', 'Everything you need to produce world-class events.'));
writePageIfMissing('(marketing)/features/[module]/page.tsx', `export default async function FeatureModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module: mod } = await params;
  const title = mod.charAt(0).toUpperCase() + mod.slice(1).replace(/-/g, ' ');
  return (
    <div className="p-8">
      <h1 className="text-heading text-2xl text-text-primary mb-2">{title}</h1>
      <p className="text-text-secondary text-sm">Feature details for {title}.</p>
    </div>
  );
}
`);
writePageIfMissing('(marketing)/solutions/[industry]/page.tsx', `export default async function SolutionPage({
  params,
}: {
  params: Promise<{ industry: string }>;
}) {
  const { industry } = await params;
  const title = industry.charAt(0).toUpperCase() + industry.slice(1).replace(/-/g, ' ');
  return (
    <div className="p-8">
      <h1 className="text-heading text-2xl text-text-primary mb-2">{title}</h1>
      <p className="text-text-secondary text-sm">How the platform serves the {title} industry.</p>
    </div>
  );
}
`);
writePageIfMissing('(marketing)/blog/page.tsx',
  stubPage('Blog', 'Insights, updates, and stories from the team.'));
writePageIfMissing('(marketing)/blog/[slug]/page.tsx', `export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-heading text-2xl text-text-primary mb-2">{slug.replace(/-/g, ' ')}</h1>
      <p className="text-text-secondary text-sm">Blog post content.</p>
    </div>
  );
}
`);
writePageIfMissing('(marketing)/changelog/page.tsx',
  stubPage('Changelog', 'Product updates and release notes.'));
writePageIfMissing('(marketing)/about/page.tsx',
  stubPage('About', 'Our team, mission, and story.'));
writePageIfMissing('(marketing)/contact/page.tsx',
  stubPage('Contact', 'Get in touch or request a demo.'));
writePageIfMissing('(marketing)/legal/terms/page.tsx',
  stubPage('Terms of Service', 'Terms and conditions for using the platform.'));
writePageIfMissing('(marketing)/legal/privacy/page.tsx',
  stubPage('Privacy Policy', 'How we handle and protect your data.'));
writePageIfMissing('(marketing)/legal/dpa/page.tsx',
  stubPage('Data Processing Agreement', 'DPA for enterprise customers.'));
writePageIfMissing('(marketing)/legal/sla/page.tsx',
  stubPage('Service Level Agreement', 'Uptime commitments and support response times.'));

// Marketing layout
writePageIfMissing('(marketing)/layout.tsx', `import Link from 'next/link';

const MARKETING_NAV = [
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--brand-color)] [box-shadow:var(--brand-shadow)]" />
            <span className="text-heading text-sm tracking-[0.2em] text-text-primary">GVTEWAY</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {MARKETING_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn btn-ghost text-sm">Log In</Link>
            <Link href="/signup" className="btn btn-primary text-sm">Get Started</Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-border py-12 mt-16">
        <div className="max-w-7xl mx-auto px-6 text-center text-text-disabled text-xs">
          © {new Date().getFullYear()} GVTEWAY. All rights reserved.
          <div className="mt-2 flex justify-center gap-4">
            <Link href="/legal/terms" className="hover:text-text-secondary transition-colors">Terms</Link>
            <Link href="/legal/privacy" className="hover:text-text-secondary transition-colors">Privacy</Link>
            <Link href="/legal/sla" className="hover:text-text-secondary transition-colors">SLA</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
`);

console.log('\n✅ IA Merge scaffold complete');
