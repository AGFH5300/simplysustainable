import { 
  users, 
  usageEntries, 
  tips, 
  badges, 
  userBadges, 
  settings,
  type User, 
  type InsertUser,
  type UsageEntry,
  type InsertUsageEntry,
  type Tip,
  type InsertTip,
  type Badge,
  type InsertBadge,
  type UserBadge,
  type InsertUserBadge,
  type Settings,
  type InsertSettings
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Usage Entries
  getUsageEntries(userId: number, limit?: number): Promise<UsageEntry[]>;
  getUsageEntryByWeek(userId: number, weekStartDate: string): Promise<UsageEntry | undefined>;
  createUsageEntry(entry: InsertUsageEntry & { userId: number }): Promise<UsageEntry>;
  updateUsageEntry(id: number, entry: Partial<InsertUsageEntry>): Promise<UsageEntry>;
  getRecentUsage(userId: number): Promise<UsageEntry[]>;

  // Tips
  getAllTips(): Promise<Tip[]>;
  getTipsByCategory(category: string): Promise<Tip[]>;
  getRandomTip(): Promise<Tip | undefined>;

  // Badges
  getAllBadges(): Promise<Badge[]>;
  getUserBadges(userId: number): Promise<(UserBadge & { badge: Badge })[]>;
  awardBadge(userBadge: InsertUserBadge): Promise<UserBadge>;
  checkBadgeEligibility(userId: number): Promise<Badge[]>;

  // Settings
  getSettings(userId: number): Promise<Settings | undefined>;
  updateSettings(userId: number, settings: Partial<InsertSettings>): Promise<Settings>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private usageEntries: Map<number, UsageEntry>;
  private tips: Map<number, Tip>;
  private badges: Map<number, Badge>;
  private userBadges: Map<number, UserBadge>;
  private settings: Map<number, Settings>;
  private currentUserId: number;
  private currentUsageId: number;
  private currentTipId: number;
  private currentBadgeId: number;
  private currentUserBadgeId: number;
  private currentSettingsId: number;

  constructor() {
    this.users = new Map();
    this.usageEntries = new Map();
    this.tips = new Map();
    this.badges = new Map();
    this.userBadges = new Map();
    this.settings = new Map();
    this.currentUserId = 1;
    this.currentUsageId = 1;
    this.currentTipId = 1;
    this.currentBadgeId = 1;
    this.currentUserBadgeId = 1;
    this.currentSettingsId = 1;

    this.initializeData();
  }

  private initializeData() {
    // Create default user
    const defaultUser: User = {
      id: 1,
      username: "user_1",
      password: "password123"
    };
    this.users.set(1, defaultUser);

    // Initialize tips
    const defaultTips: Tip[] = [
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
        description: "Set temperature 2°C higher in summer, lower in winter.",
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

    // Initialize badges
    const defaultBadges: Badge[] = [
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

    // Initialize default settings
    const defaultSettings: Settings = {
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

    // Initialize some sample weekly usage data
    const today = new Date();
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - (weekStart.getDay() === 0 ? 6 : weekStart.getDay() - 1) - (i * 7)); // Get Monday of week
      const weekStartStr = weekStart.toISOString().split('T')[0];
      
      const entry: UsageEntry = {
        id: this.currentUsageId++,
        userId: 1,
        weekStartDate: weekStartStr,
        electricityUsage: (Math.random() * 50 + 150).toFixed(2),
        electricityUnit: "kWh",
        waterUsage: (Math.random() * 300 + 1200).toFixed(0),
        waterUnit: "L",
        notes: null,
        createdAt: new Date()
      };
      this.usageEntries.set(entry.id, entry);
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getUsageEntries(userId: number, limit?: number): Promise<UsageEntry[]> {
    const entries = Array.from(this.usageEntries.values())
      .filter(entry => entry.userId === userId)
      .sort((a, b) => new Date(b.weekStartDate).getTime() - new Date(a.weekStartDate).getTime());
    
    return limit ? entries.slice(0, limit) : entries;
  }

  async getUsageEntryByWeek(userId: number, weekStartDate: string): Promise<UsageEntry | undefined> {
    return Array.from(this.usageEntries.values())
      .find(entry => entry.userId === userId && entry.weekStartDate === weekStartDate);
  }

  async createUsageEntry(entry: InsertUsageEntry & { userId: number }): Promise<UsageEntry> {
    const id = this.currentUsageId++;
    const usageEntry: UsageEntry = {
      id,
      userId: entry.userId,
      weekStartDate: entry.weekStartDate,
      electricityUsage: entry.electricityUsage || null,
      electricityUnit: entry.electricityUnit || "kWh",
      waterUsage: entry.waterUsage || null,
      waterUnit: entry.waterUnit || "L",
      notes: entry.notes || null,
      createdAt: new Date()
    };
    this.usageEntries.set(id, usageEntry);
    return usageEntry;
  }

  async updateUsageEntry(id: number, entry: Partial<InsertUsageEntry>): Promise<UsageEntry> {
    const existing = this.usageEntries.get(id);
    if (!existing) {
      throw new Error("Usage entry not found");
    }
    
    const updated: UsageEntry = {
      ...existing,
      ...entry,
      id: existing.id,
      userId: existing.userId,
      createdAt: existing.createdAt
    };
    
    this.usageEntries.set(id, updated);
    return updated;
  }

  async getRecentUsage(userId: number): Promise<UsageEntry[]> {
    return this.getUsageEntries(userId, 10);
  }

  async getAllTips(): Promise<Tip[]> {
    return Array.from(this.tips.values());
  }

  async getTipsByCategory(category: string): Promise<Tip[]> {
    return Array.from(this.tips.values()).filter(tip => tip.category === category);
  }

  async getRandomTip(): Promise<Tip | undefined> {
    const tips = Array.from(this.tips.values());
    return tips.length > 0 ? tips[Math.floor(Math.random() * tips.length)] : undefined;
  }

  async getAllBadges(): Promise<Badge[]> {
    return Array.from(this.badges.values());
  }

  async getUserBadges(userId: number): Promise<(UserBadge & { badge: Badge })[]> {
    const userBadgeEntries = Array.from(this.userBadges.values())
      .filter(ub => ub.userId === userId);
    
    return userBadgeEntries.map(ub => {
      const badge = this.badges.get(ub.badgeId);
      return { ...ub, badge: badge! };
    });
  }

  async awardBadge(userBadge: InsertUserBadge): Promise<UserBadge> {
    const id = this.currentUserBadgeId++;
    const newUserBadge: UserBadge = {
      ...userBadge,
      id,
      earnedAt: new Date()
    };
    this.userBadges.set(id, newUserBadge);
    return newUserBadge;
  }

  async checkBadgeEligibility(userId: number): Promise<Badge[]> {
    // Simple badge eligibility check for weekly data
    const entries = await this.getRecentUsage(userId);
    const earnedBadges = await this.getUserBadges(userId);
    const earnedBadgeIds = earnedBadges.map(ub => ub.badgeId);
    
    const eligibleBadges: Badge[] = [];
    
    // Check for Water Saver badge
    if (!earnedBadgeIds.includes(1) && entries.length >= 2) {
      const waterUsages = entries.map(e => parseFloat(e.waterUsage || "0"));
      const avgUsage = waterUsages.reduce((a, b) => a + b, 0) / waterUsages.length;
      if (avgUsage < 1400) { // Less than 1400L weekly average
        eligibleBadges.push(this.badges.get(1)!);
      }
    }
    
    // Check for Energy Star badge
    if (!earnedBadgeIds.includes(2) && entries.length >= 2) {
      const lowUsageWeeks = entries.filter(e => parseFloat(e.electricityUsage || "0") < 180).length;
      if (lowUsageWeeks >= 2) {
        eligibleBadges.push(this.badges.get(2)!);
      }
    }
    
    return eligibleBadges;
  }

  async getSettings(userId: number): Promise<Settings | undefined> {
    return Array.from(this.settings.values()).find(s => s.userId === userId);
  }

  async updateSettings(userId: number, newSettings: Partial<InsertSettings>): Promise<Settings> {
    const existing = await this.getSettings(userId);
    if (existing) {
      const updated = { ...existing, ...newSettings };
      this.settings.set(existing.id, updated);
      return updated;
    } else {
      const id = this.currentSettingsId++;
      const settings: Settings = {
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
      this.settings.set(id, settings);
      return settings;
    }
  }
}

export const storage = new MemStorage();
