'use client';
/** GlobalModalProvider — manages global modals from any component */
import { createContext, useContext, useState, useCallback } from 'react';

interface ModalState {
  [key: string]: boolean;
}

interface GlobalModalContextValue {
  modals: ModalState;
  openModal: (id: string) => void;
  closeModal: (id: string) => void;
  isOpen: (id: string) => boolean;
}

const ModalContext = createContext<GlobalModalContextValue>({
  modals: {},
  openModal: () => {},
  closeModal: () => {},
  isOpen: () => false,
});

export function GlobalModalProvider({ children }: { children: React.ReactNode }) {
  const [modals, setModals] = useState<ModalState>({});

  const openModal = useCallback((id: string) => {
    setModals((prev) => ({ ...prev, [id]: true }));
  }, []);

  const closeModal = useCallback((id: string) => {
    setModals((prev) => ({ ...prev, [id]: false }));
  }, []);

  const isOpen = useCallback((id: string) => !!modals[id], [modals]);

  return (
    <ModalContext.Provider value={{ modals, openModal, closeModal, isOpen }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() { return useContext(ModalContext); }
export function useGlobalModals() { return useContext(ModalContext); }

export default GlobalModalProvider;
