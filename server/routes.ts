import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUsageEntrySchema, insertSettingsSchema } from "@shared/schema";
import { z } from "zod";

// Helper function to get Monday of a given date
function getMondayOfWeek(date: Date): string {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(date.setDate(diff));
  return monday.toISOString().split('T')[0];
}

export async function registerRoutes(app: Express): Promise<Server> {
  const DEFAULT_USER_ID = 1; // For demo purposes, using a single user

  // Usage entries routes
  app.get("/api/usage", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const entries = await storage.getUsageEntries(DEFAULT_USER_ID, limit);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch usage entries" });
    }
  });

  app.get("/api/usage/current", async (req, res) => {
    try {
      const currentWeekStart = getMondayOfWeek(new Date());
      const currentWeekUsage = await storage.getUsageEntryByWeek(DEFAULT_USER_ID, currentWeekStart);
      res.json(currentWeekUsage);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch current week's usage" });
    }
  });

  app.get("/api/usage/recent", async (req, res) => {
    try {
      const recentUsage = await storage.getRecentUsage(DEFAULT_USER_ID);
      res.json(recentUsage);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent usage" });
    }
  });

  app.post("/api/usage", async (req, res) => {
    try {
      const validatedData = insertUsageEntrySchema.parse(req.body);
      
      // Check if entry already exists for this week
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
      
      // Check for badge eligibility after adding usage
      const eligibleBadges = await storage.checkBadgeEligibility(DEFAULT_USER_ID);
      for (const badge of eligibleBadges) {
        await storage.awardBadge({ userId: DEFAULT_USER_ID, badgeId: badge.id });
      }
      
      res.json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid usage data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create usage entry" });
      }
    }
  });

  app.put("/api/usage/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertUsageEntrySchema.partial().parse(req.body);
      
      const updatedEntry = await storage.updateUsageEntry(id, validatedData);
      res.json(updatedEntry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid usage data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update usage entry" });
      }
    }
  });

  // Tips routes
  app.get("/api/tips", async (req, res) => {
    try {
      const category = req.query.category as string;
      const tips = category 
        ? await storage.getTipsByCategory(category)
        : await storage.getAllTips();
      res.json(tips);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tips" });
    }
  });

  app.get("/api/tips/random", async (req, res) => {
    try {
      const tip = await storage.getRandomTip();
      res.json(tip);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch random tip" });
    }
  });

  // Badges routes
  app.get("/api/badges", async (req, res) => {
    try {
      const badges = await storage.getAllBadges();
      res.json(badges);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch badges" });
    }
  });

  app.get("/api/badges/user", async (req, res) => {
    try {
      const userBadges = await storage.getUserBadges(DEFAULT_USER_ID);
      res.json(userBadges);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user badges" });
    }
  });

  app.get("/api/badges/eligible", async (req, res) => {
    try {
      const eligibleBadges = await storage.checkBadgeEligibility(DEFAULT_USER_ID);
      res.json(eligibleBadges);
    } catch (error) {
      res.status(500).json({ message: "Failed to check badge eligibility" });
    }
  });

  // Settings routes
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings(DEFAULT_USER_ID);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put("/api/settings", async (req, res) => {
    try {
      const validatedData = insertSettingsSchema.parse(req.body);
      const settings = await storage.updateSettings(DEFAULT_USER_ID, validatedData);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid settings data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update settings" });
      }
    }
  });

  app.patch("/api/settings", async (req, res) => {
    try {
      const validatedData = insertSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateSettings(DEFAULT_USER_ID, validatedData);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid settings data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update settings" });
      }
    }
  });

  // Dashboard stats route
  app.get("/api/dashboard", async (req, res) => {
    try {
      const currentWeekStart = getMondayOfWeek(new Date());
      const currentWeekUsage = await storage.getUsageEntryByWeek(DEFAULT_USER_ID, currentWeekStart);
      const recentUsage = await storage.getRecentUsage(DEFAULT_USER_ID);
      const userBadges = await storage.getUserBadges(DEFAULT_USER_ID);
      const settings = await storage.getSettings(DEFAULT_USER_ID);
      
      // Calculate stats
      const totalPoints = userBadges.reduce((sum, ub) => sum + ub.badge.points, 0);
      
      // Calculate progress over recent weeks
      const recentElectricity = recentUsage.reduce((sum: number, entry: any) => 
        sum + parseFloat(entry.electricityUsage || "0"), 0);
      const recentWater = recentUsage.reduce((sum: number, entry: any) => 
        sum + parseFloat(entry.waterUsage || "0"), 0);
      
      // Simple savings calculation (mock for demonstration)
      const monthlySavings = Math.floor(Math.random() * 30 + 20);
      
      res.json({
        currentWeekUsage,
        recentUsage,
        totalPoints,
        monthlySavings,
        recentElectricity,
        recentWater,
        settings
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
