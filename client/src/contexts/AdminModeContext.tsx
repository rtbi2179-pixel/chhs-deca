import React, { createContext, useContext, useState, useEffect } from "react";

interface AdminModeContextType {
  adminModeActive: boolean;
  setAdminModeActive: (active: boolean) => void;
  neonOverlayRef: HTMLDivElement | null;
  setNeonOverlayRef: (ref: HTMLDivElement | null) => void;
  deactivateAdminMode: () => void;
}

const AdminModeContext = createContext<AdminModeContextType | undefined>(undefined);

interface AdminModeProviderProps {
  children: React.ReactNode;
}

export function AdminModeProvider({ children }: AdminModeProviderProps) {
  const [adminModeActive, setAdminModeActive] = useState(false);
  const [neonOverlayRef, setNeonOverlayRef] = useState<HTMLDivElement | null>(null);

  const deactivateAdminMode = () => {
    if (neonOverlayRef) {
      neonOverlayRef.remove();
      setNeonOverlayRef(null);
    }
    setAdminModeActive(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (neonOverlayRef) {
        neonOverlayRef.remove();
      }
    };
  }, [neonOverlayRef]);

  return (
    <AdminModeContext.Provider
      value={{
        adminModeActive,
        setAdminModeActive,
        neonOverlayRef,
        setNeonOverlayRef,
        deactivateAdminMode,
      }}
    >
      {children}
    </AdminModeContext.Provider>
  );
}

export function useAdminMode() {
  const context = useContext(AdminModeContext);
  if (!context) {
    throw new Error("useAdminMode must be used within AdminModeProvider");
  }
  return context;
}
