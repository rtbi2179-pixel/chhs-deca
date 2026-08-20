import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const readProjectFile = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), "utf8");

describe("Glass, Blazer, and Light Blazer website themes", () => {
  it("keeps Glass as the default and applies every saved website theme through the global provider", () => {
    const themeContext = readProjectFile("client/src/contexts/ThemeContext.tsx");
    const router = readProjectFile("server/routers.ts");

    expect(themeContext).toContain('export type WebsiteTheme = "glass" | "blazer" | "light-blazer"');
    expect(themeContext).toContain('stored === "blazer" || stored === "light-blazer"');
    expect(themeContext).toContain('document.documentElement.dataset.websiteTheme = websiteTheme');
    expect(themeContext).toContain('trpc.preferences.getProfileSettings.useQuery');
    expect(router).toContain("websiteTheme: 'glass' as const");
    expect(router).toContain("updateWebsiteTheme: protectedProcedure");
  });

  it("provides the Profile Settings selector and both dark and light Blazer presentations while preserving Glass", () => {
    const profile = readProjectFile("client/src/pages/Profile.tsx");
    const shell = readProjectFile("client/src/components/SidebarNavigation.tsx");
    const css = readProjectFile("client/src/index.css");
    const router = readProjectFile("server/routers.ts");

    expect(profile).toContain('Website style');
    expect(profile).toContain("label: 'Glass'");
    expect(profile).toContain("label: 'Blazer'");
    expect(profile).toContain("label: 'Light Blazer'");
    expect(profile).toContain('updateWebsiteTheme.mutate');
    expect(shell).toContain('data-website-theme={websiteTheme}');
    expect(shell).toContain('data-blazer-page={atmosphere}');
    expect(css).toContain(':root[data-website-theme="glass"]');
    expect(css).toContain(':root[data-website-theme="blazer"]');
    expect(css).toContain(':root[data-website-theme="light-blazer"]');
    expect(css).toContain('color-scheme: light');
    expect(css).toContain('--background: #f4f8fc');
    for (const suppliedColor of ['#F8C524', '#7C8689', '#009B46', '#0B74BF', '#CC1D36', '#91C659']) expect(css).toContain(suppliedColor);
    expect(css).toContain('button[class*="bg-blue-"]');
    expect(css).toContain('background-image: none !important');
    expect(css).toContain('--blazer-page-action');
    expect(css).toContain('data-blazer-page="events"');
    expect(css).toContain('data-blazer-page="announcements"');
    expect(css).toContain('data-blazer-page="volunteer"');
    expect(profile).toContain('Light Blazer brings the same palette into a clean, high-contrast light mode');
    expect(router).toContain("z.enum(['glass', 'blazer', 'light-blazer'])");
  });

  it("keeps every Light Blazer navigation state readable without flattening section color cues", () => {
    const shell = readProjectFile("client/src/components/SidebarNavigation.tsx");
    const css = readProjectFile("client/src/index.css");

    for (const group of ["main", "chapter", "financial", "management"]) {
      expect(shell).toContain(`data-nav-group=\"${group}\"`);
    }
    expect(css).toContain('.blueblazer-sidebar a:not([class*="bg-blue-600"])');
    expect(css).toContain('color: #20384d !important');
    expect(css).toContain('background-color: #0B74BF !important');
    expect(css).toContain('color: #fff !important');
    expect(css).toContain('[data-nav-group="financial"]');
    expect(css).toContain('[data-nav-group="management"]');
    expect(css).toContain('outline: 3px solid #0B74BF !important');
  });

  it("applies readable palette-based hierarchy to Light Blazer metrics and supporting dashboard panels", () => {
    const home = readProjectFile("client/src/pages/Home.tsx");
    const profile = readProjectFile("client/src/pages/Profile.tsx");
    const css = readProjectFile("client/src/index.css");

    for (const tone of ["blue", "green", "yellow", "slate"]) {
      expect(home).toContain(`tone: '${tone}'`);
      expect(css).toContain(`[data-metric-tone="${tone}"]`);
      expect(profile).toContain(`tone: '${tone}'`);
      expect(css).toContain(`[data-profile-metric-tone="${tone}"]`);
    }
    expect(home).toContain('data-overview-panel="financial"');
    expect(home).toContain('data-overview-panel="news"');
    expect(home).toContain('data-overview-panel="chapter"');
    expect(css).toContain('.overview-metric-value { color: #132233 !important; }');
    expect(css).toContain('.overview-support-panel[data-overview-panel="financial"]');
    expect(css).toContain('.overview-support-panel[data-overview-panel="chapter"]');
  });
});
