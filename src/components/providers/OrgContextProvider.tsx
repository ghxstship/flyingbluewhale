'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import type { PlatformRole } from '@/lib/supabase/types';
import type { OrgTier } from '@/lib/rbac/capabilities';

/* ═══════════════════════════════════════════════════════
   Organization Context
   Global context to provide the active organization's state
   (slug, tier, user role, branding) to the entire application.
   ═══════════════════════════════════════════════════════ */

export interface OrganizationContextState {
  organizationId: string | null;
  slug: string | null;
  tier: OrgTier;
  userRole: PlatformRole | null;
  isLoading: boolean;
}

const defaultState: OrganizationContextState = {
  organizationId: null,
  slug: null,
  tier: 'professional',
  userRole: null,
  isLoading: true,
};

const OrganizationContext = createContext<OrganizationContextState>(defaultState);

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization data must be used within an OrgContextProvider');
  }
  return context;
};

interface OrgProviderProps {
  children: ReactNode;
  initialData?: Partial<OrganizationContextState>;
}

export function OrgContextProvider({ children, initialData }: OrgProviderProps) {
  // In a real implementation this would fetch dynamically or be seeded via server components
  const [state] = React.useState<OrganizationContextState>({
    ...defaultState,
    ...initialData,
    isLoading: false,
  });

  return (
    <OrganizationContext.Provider value={state}>
      <div data-platform={state.slug ?? 'gvteway'} className="w-full h-full contents">
        {children}
      </div>
    </OrganizationContext.Provider>
  );
}
