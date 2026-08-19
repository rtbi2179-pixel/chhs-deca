import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "..");
const readSource = (...segments: string[]) => readFileSync(path.join(projectRoot, ...segments), "utf8");

describe("Blue Blazer cursor effect", () => {
  it("mounts a lightweight global cursor layer with a blue core, burn, and click pulse", () => {
    const app = readSource("client", "src", "App.tsx");
    const cursor = readSource("client", "src", "components", "BlueBlazerCursor.tsx");

    expect(app).toContain("<BlueBlazerCursor />");
    expect(cursor).toContain("blueblazer-cursor-core");
    expect(cursor).toContain("blueblazer-cursor-burn");
    expect(cursor).toContain("blueblazer-cursor-ring");
    expect(cursor).toContain("blueblazer-cursor-pulse");
    expect(cursor).toContain('window.addEventListener("pointermove"');
    expect(cursor).toContain('window.addEventListener("pointerdown"');
    expect(cursor).toContain("window.requestAnimationFrame(renderAtPointer)");
    expect(cursor).not.toContain("TRAIL_PARTICLE_COUNT");
    expect(cursor).not.toContain("blueblazer-cursor-trail");
  });

  it("limits the effect to fine pointers, disables it for reduced motion, and preserves text-entry cursors", () => {
    const cursor = readSource("client", "src", "components", "BlueBlazerCursor.tsx");
    const css = readSource("client", "src", "index.css");

    expect(cursor).toContain('(hover: hover) and (pointer: fine)');
    expect(cursor).toContain('(prefers-reduced-motion: reduce)');
    expect(cursor).toContain("window.cancelAnimationFrame(frame)");
    expect(css).toContain("html.blueblazer-cursor-active");
    expect(css).toContain("@media (hover: none), (pointer: coarse), (prefers-reduced-motion: reduce)");
    expect(css).toContain('[contenteditable="true"]');
    expect(css).toContain("blueblazer-cursor-click-pulse");
  });
});
