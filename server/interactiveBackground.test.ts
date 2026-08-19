import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const readProjectFile = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), "utf8");

describe("InteractiveBackground", () => {
  it("uses the advanced Overview visual variant instead of a static graphic", () => {
    const home = readProjectFile("client/src/pages/Home.tsx");
    const background = readProjectFile("client/src/components/InteractiveBackground.tsx");

    expect(home).toContain('<InteractiveBackground variant="overview" />');
    expect(background).toContain('export type BackgroundVariant = "hero" | "overview" | "study" | "practice"');
    expect(background).toContain("configurationByVariant");
    expect(background).toContain("constellationShapes");
    expect(background).toContain("shape: \"orbit\"");
    expect(background).toContain("const orbitalVelocity");
    expect(background).toContain("shape: \"chart\"");
    expect(background).toContain("const configuration = configurationByVariant[variant]");
    expect(background).toContain("activeNodes");
    expect(background).toContain("drawRoundedFrame");
  });

  it("keeps Overview pointer-responsive while using lighter ambient animation on every other route", () => {
    const background = readProjectFile("client/src/components/InteractiveBackground.tsx");

    expect(background).toContain("pointerRef = useRef");
    expect(background).not.toContain("useState");
    expect(background).toContain("Math.min(window.devicePixelRatio || 1, lowPowerDevice ? 1 : 1.5)");
    expect(background).toContain("time - lastDrawTime >= targetFrameMs");
    expect(background).toContain('const isInteractive = variant === "overview"');
    expect(background).toContain("if (isInteractive) {");
    expect(background).toContain("pointerIsNear = isInteractive");
    expect(background).toContain("new ResizeObserver");
    expect(background).toContain("prefers-reduced-motion: reduce");
    expect(background).toContain('document.addEventListener("visibilitychange"');
    expect(background).toContain('aria-hidden="true"');
  });
});
