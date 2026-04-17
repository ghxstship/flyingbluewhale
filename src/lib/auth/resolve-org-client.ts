/** Stub: resolve-org-client — resolves the current org for the authenticated user */
import { createClient } from '@/lib/supabase/server';

export async function resolveOrgClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, org: null };
  
  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id, role, organizations(*)')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  return {
    supabase,
    user,
    org: orgMember?.organizations ?? null,
    orgId: orgMember?.organization_id ?? null,
    organizationId: orgMember?.organization_id ?? null,
    role: orgMember?.role ?? null,
  };
}

export default resolveOrgClient;

/** Alias for backwards compatibility */
export const resolveClientOrg = resolveOrgClient;
