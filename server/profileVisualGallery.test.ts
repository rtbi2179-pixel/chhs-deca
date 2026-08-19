import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), "utf8");

describe("profile avatar and banner gallery", () => {
  it("provides curated DECA and general visual options", () => {
    const visuals = read("client/src/lib/profileVisuals.ts");

    for (const requiredOption of ["deca-compass", "deca-trophy", "deca-presentation", "mountain", "orbit", "botanical", "deca-strategy", "deca-stage", "aurora", "city", "studio"]) {
      expect(visuals).toContain(requiredOption);
    }
    expect(visuals).toContain("category: 'DECA'");
    expect(visuals).toContain("category: 'General'");
  });

  it("renders selected avatar and banner choices in Profile and the authenticated sidebar", () => {
    const profile = read("client/src/pages/Profile.tsx");
    const sidebar = read("client/src/components/SidebarNavigation.tsx");

    for (const requiredProfileMarker of ["PROFILE_AVATAR_OPTIONS", "PROFILE_BANNER_OPTIONS", "selectedAvatar.src", "selectedBanner.src", "avatarKey: profileCustomization.avatarKey", "bannerKey: profileCustomization.bannerKey"]) {
      expect(profile).toContain(requiredProfileMarker);
    }
    expect(sidebar).toContain("getProfileAvatar");
    expect(sidebar).toContain("profileSettingsQuery");
    expect(sidebar).toContain("profileAvatar.src");
  });
});
