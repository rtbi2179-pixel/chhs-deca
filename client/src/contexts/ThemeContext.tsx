import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

type Theme = "light" | "dark";
export type WebsiteTheme = "glass" | "blazer" | "light-blazer";

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  switchable: boolean;
  websiteTheme: WebsiteTheme;
  setWebsiteTheme: (websiteTheme: WebsiteTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const { user } = useAuth();
  const [theme, setTheme] = useState<Theme>(() => {
    if (switchable) {
      const stored = localStorage.getItem("theme");
      return (stored as Theme) || defaultTheme;
    }
    return defaultTheme;
  });
  const [websiteTheme, setWebsiteTheme] = useState<WebsiteTheme>(() => {
    const stored = localStorage.getItem("blueblazer:website-theme");
    return stored === "blazer" || stored === "light-blazer" ? stored : "glass";
  });
  const profileSettingsQuery = trpc.preferences.getProfileSettings.useQuery(undefined, { enabled: Boolean(user?.id), staleTime: 60_000 });

  useEffect(() => {
    const savedWebsiteTheme = profileSettingsQuery.data?.websiteTheme;
    if (savedWebsiteTheme === "glass" || savedWebsiteTheme === "blazer" || savedWebsiteTheme === "light-blazer") setWebsiteTheme(savedWebsiteTheme);
  }, [profileSettingsQuery.data?.websiteTheme]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");

    if (switchable) localStorage.setItem("theme", theme);
  }, [theme, switchable]);

  useEffect(() => {
    document.documentElement.dataset.websiteTheme = websiteTheme;
    localStorage.setItem("blueblazer:website-theme", websiteTheme);
  }, [websiteTheme]);

  const toggleTheme = switchable
    ? () => {
        setTheme(prev => (prev === "light" ? "dark" : "light"));
      }
    : undefined;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, switchable, websiteTheme, setWebsiteTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
