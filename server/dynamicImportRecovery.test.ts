import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  STALE_DYNAMIC_IMPORT_RECOVERY_KEY,
  isStaleDynamicImportError,
  recoverStaleDynamicImport,
} from "../client/src/lib/dynamicImportRecovery";

describe("stale dynamic-import recovery", () => {
  it("recognizes the browser errors produced when a prior deployment's chunk no longer exists", () => {
    expect(isStaleDynamicImportError(new TypeError("Failed to fetch dynamically imported module: https://blueblazer.us/assets/SpeechAI-oldhash.js"))).toBe(true);
    expect(isStaleDynamicImportError(new TypeError("Importing a module script failed."))).toBe(true);
    expect(isStaleDynamicImportError(new Error("A normal validation error"))).toBe(false);
  });

  it("reloads only once in a browser session to prevent a stale deployment retry loop", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };
    const reload = vi.fn();

    expect(recoverStaleDynamicImport({ storage, reload })).toBe(true);
    expect(values.get(STALE_DYNAMIC_IMPORT_RECOVERY_KEY)).toBe("true");
    expect(reload).toHaveBeenCalledTimes(1);
    expect(recoverStaleDynamicImport({ storage, reload })).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("wires both Vite preload errors and React lazy-route errors into recovery", () => {
    const app = readFileSync(join(process.cwd(), "client/src/App.tsx"), "utf8");
    const boundary = readFileSync(join(process.cwd(), "client/src/components/ErrorBoundary.tsx"), "utf8");

    expect(app).toContain('window.addEventListener("vite:preloadError", handlePreloadError)');
    expect(app).toContain("recoverStaleDynamicImportInBrowser()");
    expect(boundary).toContain("componentDidCatch(error: Error)");
    expect(boundary).toContain("A newer Blue Blazer version is ready.");
  });
});
