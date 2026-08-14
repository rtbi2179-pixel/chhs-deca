import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "..");
const readSource = (...segments: string[]) => readFileSync(path.join(projectRoot, "client", "src", ...segments), "utf8");

describe("welcome and onboarding visual hierarchy", () => {
  it("keeps a prominent branded mark on the signed-out welcome experience", () => {
    const source = readSource("components", "SignedOutWelcome.tsx");
    expect(source).toContain('h-52 w-52');
    expect(source).toContain('CHAPTER MARK');
    expect(source).toContain('BLUE BLAZER');
    expect(source).toContain('ROAD TO ICDC');
  });

  it("uses layered Blue Blazer visual markers in the onboarding tour", () => {
    const source = readSource("components", "FirstSignInTour.tsx");
    expect(source).toContain('BLUE BLAZER START');
    expect(source).toContain('TOUR PROGRESS');
    expect(source).toContain('YOUR FIRST MOVE');
  });
});
