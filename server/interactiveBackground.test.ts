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

  it("keeps Overview pointer-responsive while freezing non-Overview canvas scenes after one draw", () => {
    const background = readProjectFile("client/src/components/InteractiveBackground.tsx");

    expect(background).toContain("pointerRef = useRef");
    expect(background).not.toContain("useState");
    expect(background).toContain("Math.min(window.devicePixelRatio || 1, lowPowerDevice ? 1 : 1.5)");
    expect(background).toContain("time - lastDrawTime >= targetFrameMs");
    expect(background).toContain('const isInteractive = variant === "overview"');
    expect(background).toContain("if (!isInteractive || prefersReducedMotion) drawScene(0)");
    expect(background).toContain("if (isInteractive && isPageVisible && !prefersReducedMotion)");
    expect(background).toContain('data-interactive={variant === "overview"}');
    expect(background).toContain("if (isInteractive) {");
    expect(background).toContain("pointerIsNear = isInteractive");
    expect(background).toContain("new ResizeObserver");
    expect(background).toContain("prefers-reduced-motion: reduce");
    expect(background).toContain('document.addEventListener("visibilitychange"');
    expect(background).toContain('aria-hidden="true"');
  });

  it("keeps a low-cost CSS ambient treatment outside Overview instead of a continuous canvas loop", () => {
    const css = readProjectFile("client/src/index.css");

    expect(css).toContain('.app-atmosphere:not([data-atmosphere="overview"])::after');
    expect(css).toContain('blueblazer-ambient-drift');
    expect(css).toContain('animation: blueblazer-ambient-drift 22s');
    expect(css).toContain('prefers-reduced-motion: reduce');
  });

  it("guards dynamic gradient opacity values so canvas colors cannot contain NaN", () => {
    const background = readProjectFile("client/src/components/InteractiveBackground.tsx");

    expect(background).toContain("const finite =");
    expect(background).toContain("const alpha =");
    expect(background).toContain("!Number.isFinite(width) || !Number.isFinite(height)");
    expect(background).toContain("const opacity = alpha(");
    expect(background).toContain("alpha(opacity * 1.45)");
  });
});
