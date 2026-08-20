import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("tiered achievement unlocks", () => {
  const shared = readFileSync(resolve(process.cwd(), "shared/achievementTiers.ts"), "utf8");
  const schema = readFileSync(resolve(process.cwd(), "drizzle/schema.ts"), "utf8");
  const engine = readFileSync(resolve(process.cwd(), "server/achievementTiers.ts"), "utf8");
  const router = readFileSync(resolve(process.cwd(), "server/achievementsRouter.ts"), "utf8");
  const notifier = readFileSync(resolve(process.cwd(), "client/src/components/AchievementUnlockNotifier.tsx"), "utf8");
  const panel = readFileSync(resolve(process.cwd(), "client/src/components/AchievementTierPanel.tsx"), "utf8");

  it("defines Bronze, Silver, and Gold thresholds for every existing milestone", () => {
    expect(shared).toContain('ACHIEVEMENT_TIERS = ["bronze", "silver", "gold"]');
    for (const id of ["first-step", "practice-builder", "precision-practice", "consistency", "knowledge-keeper", "event-ready", "portfolio-starter"]) {
      expect(shared).toContain(`id: "${id}"`);
    }
    expect(shared.match(/tier: "bronze"/g)?.length).toBe(7);
    expect(shared.match(/tier: "silver"/g)?.length).toBe(7);
    expect(shared.match(/tier: "gold"/g)?.length).toBe(7);
  });

  it("uses a unique server-verified unlock record before notifying a member", () => {
    expect(schema).toContain('mysqlTable("achievementUnlocks"');
    expect(schema).toContain('unique("achievement_unlock_user_tier").on(table.userId, table.achievementId, table.tier)');
    expect(engine).toContain("const eligible = new Map<string, AchievementUnlock>");
    expect(engine).toContain("recordAchievementUnlocks");
    expect(router).toContain("recordUnlocks");
    expect(router).toContain("getSummary");
  });

  it("shows the celebratory toast only after first-load backfill and renders tiered progress", () => {
    expect(notifier).toContain("const shouldCelebrate = initialized.current");
    expect(notifier).toContain("toast.custom");
    expect(notifier).toContain("animate-in fade-in zoom-in-95");
    expect(notifier).toContain("refetchInterval: 20_000");
    expect(panel).toContain("Bronze, Silver, and Gold");
    expect(panel).toContain("Tiers earned");
    expect(panel).toContain("Next tier");
  });
});
