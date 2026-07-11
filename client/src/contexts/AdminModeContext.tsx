import React, { createContext, useContext, useState, useEffect } from "react";
import { createPortal } from "react-dom";

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
  // Keep neonOverlayRef for backward compat but we no longer use raw DOM
  const [neonOverlayRef, setNeonOverlayRef] = useState<HTMLDivElement | null>(null);

  const deactivateAdminMode = () => {
    // Clean up any lingering raw DOM overlays from old code
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
      {/* Neon ring rendered via React portal so it persists across page navigation */}
      {adminModeActive && createPortal(
        <div
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 9999,
            background: "radial-gradient(circle at center, rgba(59,130,246,0.12) 0%, transparent 70%)",
            boxShadow: "inset 0 0 80px rgba(59,130,246,0.5), inset 0 0 30px rgba(59,130,246,0.3)",
            border: "2px solid rgba(59,130,246,0.8)",
          }}
        />,
        document.body
      )}
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
