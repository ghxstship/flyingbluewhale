'use client';

import React, { createContext, useContext } from 'react';

type GlobalProfileWrapperProps = {
  children: React.ReactNode;
  globalProfile: any;
};

const GlobalProfileContext = createContext<any>(null);

export const useGlobalProfile = () => {
  return useContext(GlobalProfileContext);
};

export function GlobalProfileProvider({ children, globalProfile }: GlobalProfileWrapperProps) {
  return (
    <GlobalProfileContext.Provider value={globalProfile}>
      {children}
    </GlobalProfileContext.Provider>
  );
}
