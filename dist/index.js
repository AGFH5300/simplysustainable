// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
var MemStorage = class {
  users;
  usageEntries;
  tips;
  badges;
  userBadges;
  settings;
  currentUserId;
  currentUsageId;
  currentTipId;
  currentBadgeId;
  currentUserBadgeId;
  currentSettingsId;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.usageEntries = /* @__PURE__ */ new Map();
    this.tips = /* @__PURE__ */ new Map();
    this.badges = /* @__PURE__ */ new Map();
    this.userBadges = /* @__PURE__ */ new Map();
    this.settings = /* @__PURE__ */ new Map();
    this.currentUserId = 1;
    this.currentUsageId = 1;
    this.currentTipId = 1;
    this.currentBadgeId = 1;
    this.currentUserBadgeId = 1;
    this.currentSettingsId = 1;
    this.initializeData();
  }
  initializeData() {
    const defaultUser = {
      id: 1,
      username: "user_1",
      password: "password123"
    };
    this.users.set(1, defaultUser);
    const defaultTips = [
      {
        id: 1,
        title: "Unplug Electronics",
        description: "Devices on standby can consume 5-10% of your electricity bill.",
        category: "electricity",
        difficulty: "easy",
        potentialSavings: "$2-5/month",
        icon: "tv"
      },
      {
        id: 2,
        title: "Adjust Thermostat",
        description: "Set temperature 2\xB0C higher in summer, lower in winter.",
        category: "electricity",
        difficulty: "medium",
        potentialSavings: "$10-20/month",
        icon: "thermometer-half"
      },
      {
        id: 3,
        title: "Use Natural Light",
        description: "Open curtains during day, turn off unnecessary lights.",
        category: "electricity",
        difficulty: "easy",
        potentialSavings: "$3-8/month",
        icon: "sun"
      },
      {
        id: 4,
        title: "Shorter Showers",
        description: "Reduce shower time by 2 minutes to save 10+ liters daily.",
        category: "water",
        difficulty: "easy",
        potentialSavings: "$5-10/month",
        icon: "shower"
      },
      {
        id: 5,
        title: "Fix Leaky Taps",
        description: "A dripping tap can waste over 3,000 liters per year.",
        category: "water",
        difficulty: "medium",
        potentialSavings: "$15-25/month",
        icon: "wrench"
      },
      {
        id: 6,
        title: "Full Load Washing",
        description: "Wait for full loads before running washing machine or dishwasher.",
        category: "water",
        difficulty: "easy",
        potentialSavings: "$3-7/month",
        icon: "tshirt"
      }
    ];
    defaultTips.forEach((tip, index) => {
      this.tips.set(index + 1, { ...tip, id: index + 1 });
    });
    this.currentTipId = defaultTips.length + 1;
    const defaultBadges = [
      {
        id: 1,
        name: "Water Saver",
        description: "Save 20% water usage",
        icon: "tint",
        requirement: "Reduce water usage by 20% for 3 consecutive days",
        points: 50
      },
      {
        id: 2,
        name: "Energy Star",
        description: "5 days low usage",
        icon: "bolt",
        requirement: "Keep electricity usage below daily limit for 5 days",
        points: 75
      },
      {
        id: 3,
        name: "Eco Master",
        description: "1 month streak",
        icon: "leaf",
        requirement: "Maintain conservation goals for 30 days",
        points: 200
      },
      {
        id: 4,
        name: "Champion",
        description: "Top 10% saver",
        icon: "trophy",
        requirement: "Achieve top 10% in monthly savings",
        points: 300
      }
    ];
    defaultBadges.forEach((badge, index) => {
      this.badges.set(index + 1, { ...badge, id: index + 1 });
    });
    this.currentBadgeId = defaultBadges.length + 1;
    const defaultSettings = {
      id: 1,
      userId: 1,
      electricityLimit: "200",
      electricityUnit: "kWh",
      waterLimit: "1500",
      waterUnit: "L",
      weeklyAlerts: true,
      thresholdAlerts: true,
      savingTips: true
    };
    this.settings.set(1, defaultSettings);
    const today = /* @__PURE__ */ new Date();
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - (weekStart.getDay() === 0 ? 6 : weekStart.getDay() - 1) - i * 7);
      const weekStartStr = weekStart.toISOString().split("T")[0];
      const entry = {
        id: this.currentUsageId++,
        userId: 1,
        weekStartDate: weekStartStr,
        electricityUsage: (Math.random() * 50 + 150).toFixed(2),
        electricityUnit: "kWh",
        waterUsage: (Math.random() * 300 + 1200).toFixed(0),
        waterUnit: "L",
        notes: null,
        createdAt: /* @__PURE__ */ new Date()
      };
      this.usageEntries.set(entry.id, entry);
    }
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find((user) => user.username === username);
  }
  async createUser(insertUser) {
    const id = this.currentUserId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  async getUsageEntries(userId, limit) {
    const entries = Array.from(this.usageEntries.values()).filter((entry) => entry.userId === userId).sort((a, b) => new Date(b.weekStartDate).getTime() - new Date(a.weekStartDate).getTime());
    return limit ? entries.slice(0, limit) : entries;
  }
  async getUsageEntryByWeek(userId, weekStartDate) {
    return Array.from(this.usageEntries.values()).find((entry) => entry.userId === userId && entry.weekStartDate === weekStartDate);
  }
  async createUsageEntry(entry) {
    const id = this.currentUsageId++;
    const usageEntry = {
      id,
      userId: entry.userId,
      weekStartDate: entry.weekStartDate,
      electricityUsage: entry.electricityUsage || null,
      electricityUnit: entry.electricityUnit || "kWh",
      waterUsage: entry.waterUsage || null,
      waterUnit: entry.waterUnit || "L",
      notes: entry.notes || null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.usageEntries.set(id, usageEntry);
    return usageEntry;
  }
  async updateUsageEntry(id, entry) {
    const existing = this.usageEntries.get(id);
    if (!existing) {
      throw new Error("Usage entry not found");
    }
    const updated = {
      ...existing,
      ...entry,
      id: existing.id,
      userId: existing.userId,
      createdAt: existing.createdAt
    };
    this.usageEntries.set(id, updated);
    return updated;
  }
  async getRecentUsage(userId) {
    return this.getUsageEntries(userId, 10);
  }
  async getAllTips() {
    return Array.from(this.tips.values());
  }
  async getTipsByCategory(category) {
    return Array.from(this.tips.values()).filter((tip) => tip.category === category);
  }
  async getRandomTip() {
    const tips2 = Array.from(this.tips.values());
    return tips2.length > 0 ? tips2[Math.floor(Math.random() * tips2.length)] : void 0;
  }
  async getAllBadges() {
    return Array.from(this.badges.values());
  }
  async getUserBadges(userId) {
    const userBadgeEntries = Array.from(this.userBadges.values()).filter((ub) => ub.userId === userId);
    return userBadgeEntries.map((ub) => {
      const badge = this.badges.get(ub.badgeId);
      return { ...ub, badge };
    });
  }
  async awardBadge(userBadge) {
    const id = this.currentUserBadgeId++;
    const newUserBadge = {
      ...userBadge,
      id,
      earnedAt: /* @__PURE__ */ new Date()
    };
    this.userBadges.set(id, newUserBadge);
    return newUserBadge;
  }
  async checkBadgeEligibility(userId) {
    const entries = await this.getRecentUsage(userId);
    const earnedBadges = await this.getUserBadges(userId);
    const earnedBadgeIds = earnedBadges.map((ub) => ub.badgeId);
    const eligibleBadges = [];
    if (!earnedBadgeIds.includes(1) && entries.length >= 2) {
      const waterUsages = entries.map((e) => parseFloat(e.waterUsage || "0"));
      const avgUsage = waterUsages.reduce((a, b) => a + b, 0) / waterUsages.length;
      if (avgUsage < 1400) {
        eligibleBadges.push(this.badges.get(1));
      }
    }
    if (!earnedBadgeIds.includes(2) && entries.length >= 2) {
      const lowUsageWeeks = entries.filter((e) => parseFloat(e.electricityUsage || "0") < 180).length;
      if (lowUsageWeeks >= 2) {
        eligibleBadges.push(this.badges.get(2));
      }
    }
    return eligibleBadges;
  }
  async getSettings(userId) {
    return Array.from(this.settings.values()).find((s) => s.userId === userId);
  }
  async updateSettings(userId, newSettings) {
    const existing = await this.getSettings(userId);
    if (existing) {
      const updated = { ...existing, ...newSettings };
      this.settings.set(existing.id, updated);
      return updated;
    } else {
      const id = this.currentSettingsId++;
      const settings2 = {
        id,
        userId,
        electricityLimit: "200",
        electricityUnit: "kWh",
        waterLimit: "1500",
        waterUnit: "L",
        weeklyAlerts: true,
        thresholdAlerts: true,
        savingTips: true,
        ...newSettings
      };
      this.settings.set(id, settings2);
      return settings2;
    }
  }
};
var storage = new MemStorage();

// shared/schema.ts
import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var usageEntries = pgTable("usage_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  weekStartDate: text("week_start_date").notNull(),
  // YYYY-MM-DD format (Monday of the week)
  electricityUsage: text("electricity_usage"),
  // electricity usage value stored as text
  electricityUnit: text("electricity_unit").notNull().default("kWh"),
  // kWh, MWh, Wh, etc.
  waterUsage: text("water_usage"),
  // water usage value stored as text
  waterUnit: text("water_unit").notNull().default("L"),
  // L, gal, m³, etc.
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow()
});
var tips = pgTable("tips", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  // electricity, water
  difficulty: text("difficulty").notNull(),
  // easy, medium, hard
  potentialSavings: text("potential_savings"),
  icon: text("icon").notNull()
});
var badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  requirement: text("requirement").notNull(),
  points: integer("points").notNull().default(0)
});
var userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  badgeId: integer("badge_id").notNull(),
  earnedAt: timestamp("earned_at").defaultNow()
});
var settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  electricityLimit: text("electricity_limit").notNull().default("200"),
  // Weekly limit
  electricityUnit: text("electricity_unit").notNull().default("kWh"),
  waterLimit: text("water_limit").notNull().default("1500"),
  // Weekly limit
  waterUnit: text("water_unit").notNull().default("L"),
  weeklyAlerts: boolean("weekly_alerts").notNull().default(true),
  thresholdAlerts: boolean("threshold_alerts").notNull().default(true),
  savingTips: boolean("saving_tips").notNull().default(true)
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var insertUsageEntrySchema = createInsertSchema(usageEntries).omit({
  id: true,
  userId: true,
  createdAt: true
}).extend({
  electricityUsage: z.string().optional(),
  waterUsage: z.string().optional(),
  electricityUnit: z.string().default("kWh"),
  waterUnit: z.string().default("L")
});
var insertTipSchema = createInsertSchema(tips).omit({
  id: true
});
var insertBadgeSchema = createInsertSchema(badges).omit({
  id: true
});
var insertUserBadgeSchema = createInsertSchema(userBadges).omit({
  id: true,
  earnedAt: true
});
var insertSettingsSchema = createInsertSchema(settings).omit({
  id: true
});

// server/routes.ts
import { z as z2 } from "zod";
function getMondayOfWeek(date) {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  return monday.toISOString().split("T")[0];
}
async function registerRoutes(app2) {
  const DEFAULT_USER_ID = 1;
  app2.get("/api/usage", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : void 0;
      const entries = await storage.getUsageEntries(DEFAULT_USER_ID, limit);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch usage entries" });
    }
  });
  app2.get("/api/usage/current", async (req, res) => {
    try {
      const currentWeekStart = getMondayOfWeek(/* @__PURE__ */ new Date());
      const currentWeekUsage = await storage.getUsageEntryByWeek(DEFAULT_USER_ID, currentWeekStart);
      res.json(currentWeekUsage);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch current week's usage" });
    }
  });
  app2.get("/api/usage/recent", async (req, res) => {
    try {
      const recentUsage = await storage.getRecentUsage(DEFAULT_USER_ID);
      res.json(recentUsage);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent usage" });
    }
  });
  app2.post("/api/usage", async (req, res) => {
    try {
      const validatedData = insertUsageEntrySchema.parse(req.body);
      const existingEntry = await storage.getUsageEntryByWeek(DEFAULT_USER_ID, validatedData.weekStartDate);
      if (existingEntry) {
        return res.status(409).json({
          message: "Usage data already exists for this week",
          existingEntry,
          canEdit: true
        });
      }
      const entry = await storage.createUsageEntry({
        ...validatedData,
        userId: DEFAULT_USER_ID
      });
      const eligibleBadges = await storage.checkBadgeEligibility(DEFAULT_USER_ID);
      for (const badge of eligibleBadges) {
        await storage.awardBadge({ userId: DEFAULT_USER_ID, badgeId: badge.id });
      }
      res.json(entry);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid usage data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create usage entry" });
      }
    }
  });
  app2.put("/api/usage/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertUsageEntrySchema.partial().parse(req.body);
      const updatedEntry = await storage.updateUsageEntry(id, validatedData);
      res.json(updatedEntry);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid usage data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update usage entry" });
      }
    }
  });
  app2.get("/api/tips", async (req, res) => {
    try {
      const category = req.query.category;
      const tips2 = category ? await storage.getTipsByCategory(category) : await storage.getAllTips();
      res.json(tips2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tips" });
    }
  });
  app2.get("/api/tips/random", async (req, res) => {
    try {
      const tip = await storage.getRandomTip();
      res.json(tip);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch random tip" });
    }
  });
  app2.get("/api/badges", async (req, res) => {
    try {
      const badges2 = await storage.getAllBadges();
      res.json(badges2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch badges" });
    }
  });
  app2.get("/api/badges/user", async (req, res) => {
    try {
      const userBadges2 = await storage.getUserBadges(DEFAULT_USER_ID);
      res.json(userBadges2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user badges" });
    }
  });
  app2.get("/api/badges/eligible", async (req, res) => {
    try {
      const eligibleBadges = await storage.checkBadgeEligibility(DEFAULT_USER_ID);
      res.json(eligibleBadges);
    } catch (error) {
      res.status(500).json({ message: "Failed to check badge eligibility" });
    }
  });
  app2.get("/api/settings", async (req, res) => {
    try {
      const settings2 = await storage.getSettings(DEFAULT_USER_ID);
      res.json(settings2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });
  app2.put("/api/settings", async (req, res) => {
    try {
      const validatedData = insertSettingsSchema.parse(req.body);
      const settings2 = await storage.updateSettings(DEFAULT_USER_ID, validatedData);
      res.json(settings2);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid settings data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update settings" });
      }
    }
  });
  app2.patch("/api/settings", async (req, res) => {
    try {
      const validatedData = insertSettingsSchema.partial().parse(req.body);
      const settings2 = await storage.updateSettings(DEFAULT_USER_ID, validatedData);
      res.json(settings2);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid settings data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update settings" });
      }
    }
  });
  app2.get("/api/dashboard", async (req, res) => {
    try {
      const currentWeekStart = getMondayOfWeek(/* @__PURE__ */ new Date());
      const currentWeekUsage = await storage.getUsageEntryByWeek(DEFAULT_USER_ID, currentWeekStart);
      const recentUsage = await storage.getRecentUsage(DEFAULT_USER_ID);
      const userBadges2 = await storage.getUserBadges(DEFAULT_USER_ID);
      const settings2 = await storage.getSettings(DEFAULT_USER_ID);
      const totalPoints = userBadges2.reduce((sum, ub) => sum + ub.badge.points, 0);
      const recentElectricity = recentUsage.reduce((sum, entry) => sum + parseFloat(entry.electricityUsage || "0"), 0);
      const recentWater = recentUsage.reduce((sum, entry) => sum + parseFloat(entry.waterUsage || "0"), 0);
      const monthlySavings = Math.floor(Math.random() * 30 + 20);
      res.json({
        currentWeekUsage,
        recentUsage,
        totalPoints,
        monthlySavings,
        recentElectricity,
        recentWater,
        settings: settings2
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
