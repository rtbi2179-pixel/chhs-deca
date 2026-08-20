import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Blue Blazer welcome experience", () => {
  it("communicates buyer-relevant chapter value without unsupported performance claims", () => {
    const welcome = readFileSync(join(process.cwd(), "client/src/components/SignedOutWelcome.tsx"), "utf8");

    expect(welcome).toContain("A BETTER HOME");
    expect(welcome).toContain("DECA PREP.");
    expect(welcome).toContain("guided practice, DECA event resources, chapter communication, and member progress");
    expect(welcome).toContain("MEMBER LEARNING");
    expect(welcome).toContain("CHAPTER OPERATIONS");
    expect(welcome).toContain("VISIBLE MOMENTUM");
    expect(welcome).toContain("Give your chapter a more consistent path");
  });

  it("animates the Blue Blazer mark on entry while respecting reduced-motion preferences", () => {
    const welcome = readFileSync(join(process.cwd(), "client/src/components/SignedOutWelcome.tsx"), "utf8");

    expect(welcome).toContain("useReducedMotion");
    expect(welcome).toContain("welcome-blueblazer-mark");
    expect(welcome).toContain("scale: 0.76");
    expect(welcome).toContain("rotate: -7");
    expect(welcome).toContain("repeat: Infinity");
    expect(welcome).toContain("shouldReduceMotion ? 0");
  });
});
