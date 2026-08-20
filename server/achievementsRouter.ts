import { z } from "zod";
import { ACHIEVEMENT_TIERS } from "../shared/achievementTiers";
import { getAchievementTierSummary, recordAchievementUnlocks } from "./achievementTiers";
import { protectedProcedure, router } from "./_core/trpc";

const unlockInput = z.object({
  achievementId: z.string().trim().min(1).max(50),
  tier: z.enum(ACHIEVEMENT_TIERS),
});

export const achievementsRouter = router({
  getSummary: protectedProcedure.query(({ ctx }) => getAchievementTierSummary(ctx.user)),
  recordUnlocks: protectedProcedure.input(z.object({ unlocks: z.array(unlockInput).min(1).max(21) })).mutation(({ ctx, input }) => recordAchievementUnlocks(ctx.user, input.unlocks)),
});
