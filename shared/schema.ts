import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const usageEntries = pgTable("usage_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  weekStartDate: text("week_start_date").notNull(), // YYYY-MM-DD format (Monday of the week)
  electricityUsage: text("electricity_usage"), // electricity usage value stored as text
  electricityUnit: text("electricity_unit").notNull().default("kWh"), // kWh, MWh, Wh, etc.
  waterUsage: text("water_usage"), // water usage value stored as text
  waterUnit: text("water_unit").notNull().default("L"), // L, gal, m³, etc.
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tips = pgTable("tips", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // electricity, water
  difficulty: text("difficulty").notNull(), // easy, medium, hard
  potentialSavings: text("potential_savings"),
  icon: text("icon").notNull(),
});

export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  requirement: text("requirement").notNull(),
  points: integer("points").notNull().default(0),
});

export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  badgeId: integer("badge_id").notNull(),
  earnedAt: timestamp("earned_at").defaultNow(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  electricityLimit: text("electricity_limit").notNull().default("200"), // Weekly limit
  electricityUnit: text("electricity_unit").notNull().default("kWh"),
  waterLimit: text("water_limit").notNull().default("1500"), // Weekly limit
  waterUnit: text("water_unit").notNull().default("L"),
  weeklyAlerts: boolean("weekly_alerts").notNull().default(true),
  thresholdAlerts: boolean("threshold_alerts").notNull().default(true),
  savingTips: boolean("saving_tips").notNull().default(true),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertUsageEntrySchema = createInsertSchema(usageEntries).omit({
  id: true,
  userId: true,
  createdAt: true,
}).extend({
  electricityUsage: z.string().optional(),
  waterUsage: z.string().optional(),
  electricityUnit: z.string().default("kWh"),
  waterUnit: z.string().default("L"),
});

export const insertTipSchema = createInsertSchema(tips).omit({
  id: true,
});

export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
});

export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({
  id: true,
  earnedAt: true,
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UsageEntry = typeof usageEntries.$inferSelect;
export type InsertUsageEntry = z.infer<typeof insertUsageEntrySchema>;
export type Tip = typeof tips.$inferSelect;
export type InsertTip = z.infer<typeof insertTipSchema>;
export type Badge = typeof badges.$inferSelect;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
