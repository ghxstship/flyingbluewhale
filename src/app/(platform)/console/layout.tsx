import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/Sidebar';
import { getVisibleSections, type OrgTier } from '@/lib/rbac/capabilities';
import type { PlatformRole } from '@/lib/supabase/types';

/* ═══════════════════════════════════════════════════════
   Console Layout
   Wraps ALL /console/* routes with the persistent
   sidebar navigation + main content area.
   RBAC: resolves user's org role and tier to gate
   which sidebar sections are visible.
   ═══════════════════════════════════════════════════════ */

export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const headersList = await headers();
  const pathname = headersList.get('x-next-pathname') ?? headersList.get('x-invoke-path') ?? '/console';

  // Resolve org membership for RBAC sidebar gating
  let platformRole: PlatformRole | null = null;
  let orgTier: OrgTier = 'professional'; // Default tier
  let platformBrand: string | undefined;

  if (user) {
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('role, organizations(slug)')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (orgMember) {
      platformRole = orgMember.role as PlatformRole;
      // organizations is a joined relation — extract safely
      const org = orgMember.organizations as unknown as { slug?: string } | null;
      if (org?.slug) {
        platformBrand = org.slug;
      }
    }
  }

  // Compute visible sections based on role + tier
  const visibleSections = platformRole
    ? getVisibleSections(platformRole, orgTier)
    : undefined;

  return (
    <div className="console-shell">
      <Sidebar
        userEmail={user?.email}
        currentPath={pathname}
        visibleSections={visibleSections as string[] | undefined}
        platformRole={platformRole}
        platformBrand={platformBrand}
      />
      <div className="console-main">
        <div className="console-content">
          {children}
        </div>
      </div>
    </div>
  );
}
