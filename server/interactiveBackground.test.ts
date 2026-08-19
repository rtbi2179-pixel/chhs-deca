import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const readProjectFile = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), "utf8");

describe("InteractiveBackground", () => {
  it("uses the advanced Overview visual variant instead of a static graphic", () => {
    const home = readProjectFile("client/src/pages/Home.tsx");
    const background = readProjectFile("client/src/components/InteractiveBackground.tsx");

    expect(home).toContain('<InteractiveBackground variant="overview" />');
    expect(background).toContain('type BackgroundVariant = "hero" | "overview"');
    expect(background).toContain("configuration = variant === \"overview\"");
    expect(background).toContain("activeNodes");
    expect(background).toContain("drawRoundedFrame");
  });

  it("keeps animation technically considerate through pointer refs, high-density rendering, visibility handling, and reduced-motion support", () => {
    const background = readProjectFile("client/src/components/InteractiveBackground.tsx");

    expect(background).toContain("pointerRef = useRef");
    expect(background).not.toContain("useState");
    expect(background).toContain("Math.min(window.devicePixelRatio || 1, 2)");
    expect(background).toContain("new ResizeObserver");
    expect(background).toContain("prefers-reduced-motion: reduce");
    expect(background).toContain('document.addEventListener("visibilitychange"');
    expect(background).toContain('aria-hidden="true"');
  });
});
