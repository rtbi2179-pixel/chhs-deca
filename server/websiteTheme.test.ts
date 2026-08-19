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

  it("provides the Profile Settings selector and a restrained solid-palette Blazer presentation while preserving Glass", () => {
    const profile = readProjectFile("client/src/pages/Profile.tsx");
    const shell = readProjectFile("client/src/components/SidebarNavigation.tsx");
    const css = readProjectFile("client/src/index.css");

    expect(profile).toContain('Website style');
    expect(profile).toContain("label: 'Glass'");
    expect(profile).toContain("label: 'Blazer'");
    expect(profile).toContain('updateWebsiteTheme.mutate');
    expect(shell).toContain('data-website-theme={websiteTheme}');
    expect(shell).toContain('data-blazer-page={atmosphere}');
    expect(css).toContain(':root[data-website-theme="glass"]');
    expect(css).toContain(':root[data-website-theme="blazer"]');
    for (const suppliedColor of ['#F8C524', '#7C8689', '#009B46', '#0B74BF', '#CC1D36', '#91C659']) expect(css).toContain(suppliedColor);
    expect(css).toContain('button[class*="bg-blue-"]');
    expect(css).toContain('background-image: none !important');
    expect(css).toContain('--blazer-page-action');
    expect(css).toContain('data-blazer-page="events"');
    expect(css).toContain('data-blazer-page="announcements"');
    expect(css).toContain('data-blazer-page="volunteer"');
    expect(profile).toContain('disciplined solid yellow, gray, green, blue, red, and lime control palette');
  });
});
