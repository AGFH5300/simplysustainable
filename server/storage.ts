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
        title: "Sort & Rinse Recycling",
        description: "Give containers a quick rinse so more items can be recycled.",
        category: "recycling",
        difficulty: "easy",
        potentialSavings: "8",
        icon: "recycle"
      },
      {
        id: 2,
        title: "Bring a Reusable Tote",
        description: "Keep a foldable bag handy to avoid single-use packaging.",
        category: "recycling",
        difficulty: "easy",
        potentialSavings: "6",
        icon: "bag-shopping"
      },
      {
        id: 3,
        title: "Create a Drop-off Station",
        description: "Set aside a bin for batteries, glass, and special recyclables.",
        category: "recycling",
        difficulty: "medium",
        potentialSavings: "12",
        icon: "box"
      },
      {
        id: 4,
        title: "Choose Refill Options",
        description: "Pick refillable products to cut down on packaging waste.",
        category: "recycling",
        difficulty: "medium",
        potentialSavings: "10",
        icon: "bottle-droplet"
      },
      {
        id: 5,
        title: "Host a Swap Moment",
        description: "Trade books, clothes, or supplies to keep items in use longer.",
        category: "recycling",
        difficulty: "hard",
        potentialSavings: "18",
        icon: "handshake"
      },
      {
        id: 6,
        title: "Carry a Water Bottle",
        description: "Keep a reusable bottle nearby to stay hydrated all day.",
        category: "hydration",
        difficulty: "easy",
        potentialSavings: "7",
        icon: "bottle-water"
      },
      {
        id: 7,
        title: "Set Hydration Reminders",
        description: "Use a timer or app to sip water every hour.",
        category: "hydration",
        difficulty: "easy",
        potentialSavings: "5",
        icon: "clock"
      },
      {
        id: 8,
        title: "Flavor with Fruit",
        description: "Add citrus or berries to make water more appealing.",
        category: "hydration",
        difficulty: "easy",
        potentialSavings: "6",
        icon: "lemon"
      },
      {
        id: 9,
        title: "Plan Water Breaks",
        description: "Pair a glass of water with key daily routines.",
        category: "hydration",
        difficulty: "medium",
        potentialSavings: "9",
        icon: "calendar"
      },
      {
        id: 10,
        title: "Track Your Intake",
        description: "Log cups or liters to stay consistent with your goal.",
        category: "hydration",
        difficulty: "medium",
        potentialSavings: "11",
        icon: "clipboard-list"
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
        name: "Hydration Hero",
        description: "Hit your hydration goal",
        icon: "droplet",
        requirement: "Average at least 12 cups/L for 2 weeks",
        points: 60
      },
      {
        id: 2,
        name: "Recycling Streak",
        description: "Keep the recycling rolling",
        icon: "recycle",
        requirement: "Log 10+ recycling actions for 2 weeks",
        points: 75
      },
      {
        id: 3,
        name: "Consistency Builder",
        description: "Show up week after week",
        icon: "calendar-check",
        requirement: "Log habits for 4 weeks",
        points: 100
      },
      {
        id: 4,
        name: "Dual Goal Getter",
        description: "Balance both habits",
        icon: "sparkles",
        requirement: "Meet hydration and recycling goals in 2 weeks",
        points: 140
      },
      {
        id: 5,
        name: "Mindful Tracker",
        description: "Capture habit reflections",
        icon: "pen-line",
        requirement: "Add notes in 2 habit logs",
        points: 110
      },
      {
        id: 6,
        name: "SimplySustainable Legend",
        description: "Sustain the momentum",
        icon: "award",
        requirement: "Log habits for 6 weeks",
        points: 200
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
      electricityLimit: "10",
      electricityUnit: "items",
      waterLimit: "14",
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
        electricityUsage: (Math.random() * 10 + 6).toFixed(0),
        electricityUnit: "items",
        waterUsage: (Math.random() * 6 + 10).toFixed(0),
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
    
    // Check for Hydration Hero badge
    if (!earnedBadgeIds.includes(1) && entries.length >= 2) {
      const waterUsages = entries.map(e => parseFloat(e.waterUsage || "0"));
      const avgUsage = waterUsages.reduce((a, b) => a + b, 0) / waterUsages.length;
      if (avgUsage >= 12) {
        eligibleBadges.push(this.badges.get(1)!);
      }
    }
    
    // Check for Recycling Streak badge
    if (!earnedBadgeIds.includes(2) && entries.length >= 2) {
      const strongWeeks = entries.filter(e => parseFloat(e.electricityUsage || "0") >= 10).length;
      if (strongWeeks >= 2) {
        eligibleBadges.push(this.badges.get(2)!);
      }
    }

    // Check for Consistency Builder badge
    if (!earnedBadgeIds.includes(3) && entries.length >= 4) {
      eligibleBadges.push(this.badges.get(3)!);
    }

    // Check for Dual Goal Getter badge
    if (!earnedBadgeIds.includes(4) && entries.length >= 2) {
      const dualGoalWeeks = entries.filter(entry => 
        parseFloat(entry.electricityUsage || "0") >= 10 &&
        parseFloat(entry.waterUsage || "0") >= 12
      ).length;
      if (dualGoalWeeks >= 2) {
        eligibleBadges.push(this.badges.get(4)!);
      }
    }

    // Check for Mindful Tracker badge
    if (!earnedBadgeIds.includes(5)) {
      const notedWeeks = entries.filter(entry => (entry.notes || "").trim().length > 0).length;
      if (notedWeeks >= 2) {
        eligibleBadges.push(this.badges.get(5)!);
      }
    }

    if (!earnedBadgeIds.includes(6) && entries.length >= 6) {
      eligibleBadges.push(this.badges.get(6)!);
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
        electricityLimit: "10",
        electricityUnit: "items",
        waterLimit: "14",
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
