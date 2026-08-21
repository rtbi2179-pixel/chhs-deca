import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Blue Blazer welcome experience", () => {
  it("communicates the current chapter-ready product offering without unsupported performance claims", () => {
    const welcome = readFileSync(join(process.cwd(), "client/src/components/SignedOutWelcome.tsx"), "utf8");

    expect(welcome).toContain("PREP WITH");
    expect(welcome).toContain("PERFORM WITH");
    expect(welcome).toContain("featureGroups");
    expect(welcome).toContain("Study with a purpose");
    expect(welcome).toContain("Follow a real roadmap");
    expect(welcome).toContain("Practice like competition day");
    expect(welcome).toContain("Keep work organized");
    expect(welcome).toContain("Stay connected");
    expect(welcome).toContain("Make progress tangible");
    expect(welcome).toContain("Secure chapter access");
    expect(welcome).toContain('setLocation("/login")');
  });

  it("uses progressive motion and mobile-safe content structure while respecting reduced-motion preferences", () => {
    const welcome = readFileSync(join(process.cwd(), "client/src/components/SignedOutWelcome.tsx"), "utf8");

    expect(welcome).toContain("useReducedMotion");
    expect(welcome).toContain("fadeUp");
    expect(welcome).toContain("whileHover");
    expect(welcome).toContain("sm:grid-cols-3");
    expect(welcome).toContain("md:grid-cols-2");
    expect(welcome).toContain("xl:grid-cols-3");
    expect(welcome).toContain("shouldReduceMotion ? 0");
  });
});
