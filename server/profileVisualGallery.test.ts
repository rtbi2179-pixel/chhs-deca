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

  it("uses durable uploaded artwork instead of the failed generated PNG files", () => {
    const visuals = read("client/src/lib/profileVisuals.ts");
    const expectedArtwork = [
      "avatar-deca-compass_3aeeccc6.svg",
      "avatar-deca-trophy_7cb4f6a7.svg",
      "avatar-deca-presentation_14fae3be.svg",
      "avatar-general-mountain_15ad7bbe.svg",
      "avatar-general-orbit_40c2872f.svg",
      "avatar-general-botanical_48eb0761.svg",
      "banner-deca-strategy_a87fb044.svg",
      "banner-deca-stage_18b5c7cc.svg",
      "banner-general-aurora_1b804bd0.svg",
      "banner-general-city_63195f44.svg",
      "banner-general-studio_e0b00f74.svg",
    ];

    expectedArtwork.forEach((asset) => expect(visuals).toContain(asset));
    expect(visuals).not.toContain("Image generation failed");
    expect(visuals).not.toContain("_2d7ab75d.png");
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
