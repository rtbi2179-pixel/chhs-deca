import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { sdk } from "./sdk";
import { advanceBbxSimulation, createBbxEvent } from "../bbxSimulation";
import { updateAllCreditScores } from "../creditScoreUpdater";
import { postCreditScoreRefreshNotifications } from "../blazerBuddy";
import { getDb } from "../db";
import { bbxCompanies, bbxMarketState, bbxNews, creditScoreUpdateSchedule, savingsInterestSchedule } from "../../drizzle/schema";
import { eq, lt } from "drizzle-orm";
import bbxEventBank from "../bbxEventBank.json";
import { blueNewsRetentionCutoff, blueNewsScheduleKey, chooseBlueNewsTemplate } from "../bbxScheduledNews";
import { accrueMonthlySavingsInterestForAllAccounts } from "../savingsInterestService";

type BbxEventTemplate = (typeof bbxEventBank)[number];

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));

  // Configure Permissions Policy headers for microphone access
  // Allow microphone access for the main website and embedded AI systems
  app.use((req, res, next) => {
    res.setHeader(
      'Permissions-Policy',
      'microphone=(self "https://chhsdeca-hn7kwxwp.manus.space" "https://chhsdeca-9shazsx7.manus.space"), autoplay=(self)'
    );
    next();
  });
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  app.post("/api/scheduled/bbx-tick", async (req, res) => {
    try {
      const caller = await sdk.authenticateRequest(req);
      if (!caller.isCron || !caller.taskUid) return res.status(403).json({ error: "cron-only" });
      const database = await getDb();
      const [marketState] = await database?.select().from(bbxMarketState).where(eq(bbxMarketState.scheduleCronTaskUid, caller.taskUid)).limit(1) ?? [];
      if (!marketState) return res.json({ ok: true, skipped: "orphan" });
      const result = await advanceBbxSimulation();
      return res.json({ ok: true, result, taskUid: caller.taskUid });
    } catch (error) {
      console.error("[BBX Heartbeat]", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Unable to advance BBX simulation",
        context: { url: req.originalUrl },
        timestamp: new Date().toISOString(),
      });
    }
  });
  app.post("/api/scheduled/blues-news", async (req, res) => {
    try {
      const caller = await sdk.authenticateRequest(req);
      if (!caller.isCron || !caller.taskUid) return res.status(403).json({ error: "cron-only" });
      const database = await getDb();
      if (!database) throw new Error("BBX storage is unavailable");
      const [marketState] = await database.select().from(bbxMarketState).where(eq(bbxMarketState.scheduleCronTaskUid, caller.taskUid)).limit(1);
      if (!marketState) return res.json({ ok: true, skipped: "orphan" });
      const retention = await database.delete(bbxNews).where(lt(bbxNews.publishedAt, blueNewsRetentionCutoff()));
      const deletedArticles = Number((retention as any)[0]?.affectedRows ?? 0);
      const scheduleKey = blueNewsScheduleKey();
      if (marketState.lastBlueNewsScheduleKey === scheduleKey) return res.json({ ok: true, skipped: "duplicate", scheduleKey, deletedArticles });

      const companies = await database.select().from(bbxCompanies).where(eq(bbxCompanies.status, "active"));
      if (companies.length === 0) throw new Error("No active BBX companies are available for the scheduled event");
      const template = chooseBlueNewsTemplate(bbxEventBank as BbxEventTemplate[]);
      const target = companies[Math.floor(Math.random() * companies.length)];
      const event = await createBbxEvent({
        templateId: template.id,
        companyId: template.scope === "company" ? target.id : undefined,
        sector: template.scope === "sector" ? target.sector : undefined,
        createdBy: "system",
        tickNumber: marketState.tickNumber,
      });
      await database.update(bbxMarketState).set({ lastBlueNewsScheduleKey: scheduleKey }).where(eq(bbxMarketState.id, marketState.id));
      const tick = await advanceBbxSimulation();
      return res.json({ ok: true, scheduleKey, event, tick, deletedArticles, taskUid: caller.taskUid });
    } catch (error) {
      console.error("[Blue’s News Heartbeat]", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Unable to publish Blue’s News event",
        context: { url: req.originalUrl },
        timestamp: new Date().toISOString(),
      });
    }
  });
  app.post("/api/scheduled/credit-score-update", async (req, res) => {
    try {
      const caller = await sdk.authenticateRequest(req);
      if (!caller.isCron || !caller.taskUid) return res.status(403).json({ error: "cron-only" });
      const database = await getDb();
      if (!database) throw new Error("Credit-score storage is unavailable");
      const [schedule] = await database.select().from(creditScoreUpdateSchedule).where(eq(creditScoreUpdateSchedule.taskUid, caller.taskUid)).limit(1);
      if (!schedule) return res.json({ ok: true, skipped: "orphan" });
      await updateAllCreditScores();
      const buddyNotifications = await postCreditScoreRefreshNotifications();
      const ranAt = new Date();
      await database.update(creditScoreUpdateSchedule).set({ lastRunAt: ranAt }).where(eq(creditScoreUpdateSchedule.id, schedule.id));
      return res.json({ ok: true, taskUid: caller.taskUid, ranAt: ranAt.toISOString(), buddyNotifications });
    } catch (error) {
      console.error("[Credit Score Heartbeat]", error);
      return res.status(500).json({ error: error instanceof Error ? error.message : "Unable to refresh credit scores", context: { url: req.originalUrl }, timestamp: new Date().toISOString() });
    }
  });
  app.post("/api/scheduled/savings-interest", async (req, res) => {
    try {
      const caller = await sdk.authenticateRequest(req);
      if (!caller.isCron || !caller.taskUid) return res.status(403).json({ error: "cron-only" });
      const database = await getDb();
      if (!database) throw new Error("Banking data is unavailable");
      const [schedule] = await database.select().from(savingsInterestSchedule).where(eq(savingsInterestSchedule.taskUid, caller.taskUid)).limit(1);
      if (!schedule) return res.json({ ok: true, skipped: "orphan" });
      const result = await accrueMonthlySavingsInterestForAllAccounts();
      const ranAt = new Date();
      await database.update(savingsInterestSchedule).set({ lastRunAt: ranAt }).where(eq(savingsInterestSchedule.id, schedule.id));
      return res.json({ ok: true, taskUid: caller.taskUid, ranAt: ranAt.toISOString(), result });
    } catch (error) {
      console.error("[Savings Interest Heartbeat]", error);
      return res.status(500).json({ error: error instanceof Error ? error.message : "Unable to accrue monthly savings interest", context: { url: req.originalUrl }, timestamp: new Date().toISOString() });
    }
  });
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Global error handler middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[Express Error Handler]', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
