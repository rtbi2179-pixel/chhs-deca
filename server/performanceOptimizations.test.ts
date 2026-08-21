import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), "utf8");

describe("client performance optimizations", () => {
  it("loads route and optional-shell feature code on demand", () => {
    const app = read("client/src/App.tsx");

    expect(app).toContain('const Home = lazy(() => import("./pages/Home"))');
    expect(app).toContain('const PIQuizlet = lazy(() => import("./pages/PIQuizlet"))');
    expect(app).toContain('const DirectMessagesPanel = lazy(() => import("./components/DirectMessagesPanel")');
    expect(app).toContain("<Suspense fallback={<RouteLoadingFallback />}>");
    expect(app).not.toContain('import Home from "./pages/Home"');
    expect(app).not.toContain('import PIQuizlet from "./pages/PIQuizlet"');
  });

  it("avoids loading the event catalog and frequent market refreshes at Overview startup", () => {
    const home = read("client/src/pages/Home.tsx");

    expect(home).toContain("void import('./Events')");
    expect(home).toContain("eventCatalogLoading");
    expect(home).toContain("refetchInterval: 60_000");
    expect(home).toContain("refetchInterval: 120_000");
    expect(home).not.toContain("import { allEvents } from '@/pages/Events'");
  });

  it("loads only the active PI learning activity instead of all module sections at once", () => {
    const piLibrary = read("client/src/pages/PIQuizlet.tsx");

    expect(piLibrary).toContain('activeTab === "lesson"');
    expect(piLibrary).toContain('activeTab === "flashcards"');
    expect(piLibrary).toContain('activeTab === "quiz"');
    expect(piLibrary).toContain('activeTab === "scenarios"');
    expect(piLibrary).not.toContain('activeTab === "teach-back"');
    expect(piLibrary).not.toContain('activeTab === "vocabulary"');
    expect(piLibrary).toContain("const isQuizActivity");
  });

  it("caps animated background frame and pixel work while retaining route-specific atmospheres", () => {
    const background = read("client/src/components/InteractiveBackground.tsx");

    expect(background).toContain("1000 / 30");
    expect(background).toContain("time - lastDrawTime >= targetFrameMs");
    expect(background).toContain("lowPowerDevice");
    expect(background).toContain("configurationByVariant");
  });
});
