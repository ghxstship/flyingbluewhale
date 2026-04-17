'use client';

import React, { createContext, useContext } from 'react';
import type { PlatformRole } from '@/lib/supabase/types';

/* ═══════════════════════════════════════════════════════
   GlobalProfileProvider — User context for client components
   Provides typed user/org profile to the component tree.
   ═══════════════════════════════════════════════════════ */

export interface GlobalProfile {
  userId: string;
  email: string | null;
  orgId: string | null;
  orgName: string | null;
  orgSlug: string | null;
  orgTier: string | null;
  platformRole: PlatformRole | null;
}

const GlobalProfileContext = createContext<GlobalProfile | null>(null);

export const useGlobalProfile = (): GlobalProfile | null => {
  return useContext(GlobalProfileContext);
};

/**
 * Provides typed global profile context.
 * Wrap authenticated layouts with this provider.
 * 
 * Usage:
 *   <GlobalProfileProvider globalProfile={profile}>
 *     {children}
 *   </GlobalProfileProvider>
 */
export function GlobalProfileProvider({
  children,
  globalProfile,
}: {
  children: React.ReactNode;
  globalProfile: GlobalProfile | null;
}) {
  return (
    <GlobalProfileContext.Provider value={globalProfile}>
      {children}
    </GlobalProfileContext.Provider>
  );
}
