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
      {/* Subtle administrative perimeter rendered through a portal so it persists across page navigation. */}
      {adminModeActive && createPortal(
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 9999,
            background: "radial-gradient(circle at center, rgba(59,130,246,0.035) 0%, transparent 68%)",
            boxShadow: "inset 0 0 42px rgba(59,130,246,0.18), inset 0 0 16px rgba(59,130,246,0.08)",
            border: "1px solid rgba(96,165,250,0.32)",
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
