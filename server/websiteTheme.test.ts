import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const readProjectFile = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), "utf8");

describe("Glass and Blazer website themes", () => {
  it("keeps Glass as the default and applies a saved website theme through the global provider", () => {
    const themeContext = readProjectFile("client/src/contexts/ThemeContext.tsx");
    const router = readProjectFile("server/routers.ts");

    expect(themeContext).toContain('export type WebsiteTheme = "glass" | "blazer"');
    expect(themeContext).toContain('document.documentElement.dataset.websiteTheme = websiteTheme');
    expect(themeContext).toContain('trpc.preferences.getProfileSettings.useQuery');
    expect(router).toContain("websiteTheme: 'glass' as const");
    expect(router).toContain("updateWebsiteTheme: protectedProcedure");
  });

  it("provides the Profile Settings selector and a colorful Blazer presentation while preserving Glass", () => {
    const profile = readProjectFile("client/src/pages/Profile.tsx");
    const shell = readProjectFile("client/src/components/SidebarNavigation.tsx");
    const css = readProjectFile("client/src/index.css");

    expect(profile).toContain('Website style');
    expect(profile).toContain("label: 'Glass'");
    expect(profile).toContain("label: 'Blazer'");
    expect(profile).toContain('updateWebsiteTheme.mutate');
    expect(shell).toContain('data-website-theme={websiteTheme}');
    expect(css).toContain(':root[data-website-theme="glass"]');
    expect(css).toContain(':root[data-website-theme="blazer"]');
    expect(css).toContain('linear-gradient(100deg, oklch(0.62 0.22 305)');
  });
});
