import AsyncStorage from '@react-native-async-storage/async-storage';

// ============= INTERFACES =============

export interface GamificationData {
  xp: number;
  level: number;
  streakData: StreakData;
  activeQuests: Quest[];
  completedQuests: QuestCompletion[];
  achievements: Achievement[];
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  forgivenessPasses: number; // Free passes available
  lastForgiveUseDate?: string; // When last forgiveness was used
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  type: QuestType;
  target: number;
  current: number;
  xpReward: number;
  startDate: string;
  endDate: string;
  completed: boolean;
}

export type QuestType =
  | 'fiber_intake'
  | 'hydration'
  | 'meditation'
  | 'meal_logging'
  | 'no_sugar'
  | 'intermittent_fasting'
  | 'protein_intake'
  | 'calorie_target'
  | 'step_goal';

export interface QuestCompletion {
  questId: string;
  questName: string;
  completedDate: string;
  xpEarned: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedDate: string;
  icon: string;
}

export interface XPAction {
  action: string;
  xp: number;
}

// ============= CONSTANTS =============

export const XP_REWARDS: Record<string, number> = {
  LOG_MEAL: 10,
  COMPLETE_WATER_GOAL: 15,
  MEDITATION_SESSION: 20,
  SCAN_FOOD: 5,
  REACH_CALORIE_TARGET: 25,
  REACH_STEP_GOAL: 15,
  COMPLETE_QUEST: 100,
  DAILY_LOGIN: 5,
};

const WEEKLY_FORGIVENESS_PASSES = 1;
const XP_PER_LEVEL = 100;

const KEYS = {
  GAMIFICATION_DATA: 'gamification_data',
};

// ============= QUEST TEMPLATES =============

const QUEST_TEMPLATES = {
  fiber_intake: {
    name: 'Fiber Champion',
    description: 'Consume 25g+ of fiber for 4 days this week',
    target: 4,
    xpReward: 150,
  },
  hydration: {
    name: 'Hydration Week',
    description: 'Hit your water goal 5 days this week',
    target: 5,
    xpReward: 100,
  },
  meditation: {
    name: 'Mindful Week',
    description: 'Complete 3 meditation sessions this week',
    target: 3,
    xpReward: 120,
  },
  meal_logging: {
    name: 'Consistent Logger',
    description: 'Log at least 3 meals per day for 5 days',
    target: 5,
    xpReward: 130,
  },
  no_sugar: {
    name: 'Sugar-Free Challenge',
    description: 'Keep sugar intake under 25g for 3 days',
    target: 3,
    xpReward: 200,
  },
  intermittent_fasting: {
    name: 'Fasting Warrior',
    description: 'Complete 16-hour fasting windows 3 times this week',
    target: 3,
    xpReward: 180,
  },
  protein_intake: {
    name: 'Protein Power',
    description: 'Consume 100g+ protein for 4 days this week',
    target: 4,
    xpReward: 140,
  },
  calorie_target: {
    name: 'Calorie Master',
    description: 'Stay within ±10% of calorie target for 5 days',
    target: 5,
    xpReward: 160,
  },
  step_goal: {
    name: 'Step Champion',
    description: 'Reach your step goal 6 days this week',
    target: 6,
    xpReward: 110,
  },
};

// ============= SERVICE =============

export const gamificationService = {
  // Initialize or get gamification data
  getGamificationData: async (): Promise<GamificationData> => {
    try {
      const data = await AsyncStorage.getItem(KEYS.GAMIFICATION_DATA);
      if (data) {
        const parsed = JSON.parse(data);
        // Check if we need to reset weekly forgiveness
        await gamificationService.checkWeeklyReset(parsed);
        return parsed;
      }
    } catch (error) {
      console.error('Error getting gamification data:', error);
    }

    // Return default data
    const defaultData: GamificationData = {
      xp: 0,
      level: 1,
      streakData: {
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: '',
        forgivenessPasses: WEEKLY_FORGIVENESS_PASSES,
      },
      activeQuests: [],
      completedQuests: [],
      achievements: [],
    };

    await gamificationService.saveGamificationData(defaultData);
    return defaultData;
  },

  saveGamificationData: async (data: GamificationData) => {
    try {
      await AsyncStorage.setItem(
        KEYS.GAMIFICATION_DATA,
        JSON.stringify(data),
      );
    } catch (error) {
      console.error('Error saving gamification data:', error);
    }
  },

  // XP and Leveling
  addXP: async (xp: number, reason: string): Promise<{leveledUp: boolean; newLevel: number}> => {
    const data = await gamificationService.getGamificationData();
    const oldLevel = data.level;
    data.xp += xp;

    // Calculate new level
    const newLevel = Math.floor(data.xp / XP_PER_LEVEL) + 1;
    const leveledUp = newLevel > oldLevel;
    data.level = newLevel;

    await gamificationService.saveGamificationData(data);

    return {leveledUp, newLevel};
  },

  getXPProgress: (xp: number, level: number): {current: number; required: number; percentage: number} => {
    const currentLevelXP = (level - 1) * XP_PER_LEVEL;
    const nextLevelXP = level * XP_PER_LEVEL;
    const current = xp - currentLevelXP;
    const required = nextLevelXP - currentLevelXP;
    const percentage = (current / required) * 100;

    return {current, required, percentage};
  },

  // Streak Management with Forgiveness
  updateStreak: async (): Promise<{streak: number; usedForgiveness: boolean}> => {
    const data = await gamificationService.getGamificationData();
    const today = new Date().toISOString().split('T')[0];
    const streakData = data.streakData;

    // Already logged today
    if (streakData.lastActiveDate === today) {
      return {streak: streakData.currentStreak, usedForgiveness: false};
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let usedForgiveness = false;

    // Continue streak if yesterday was logged
    if (streakData.lastActiveDate === yesterdayStr) {
      streakData.currentStreak += 1;
    } else {
      // Check if we can use forgiveness
      const lastActive = new Date(streakData.lastActiveDate);
      const daysSinceActive = Math.floor(
        (new Date(today).getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysSinceActive === 2 && streakData.forgivenessPasses > 0) {
        // Missed one day, use forgiveness
        streakData.currentStreak += 1;
        streakData.forgivenessPasses -= 1;
        streakData.lastForgiveUseDate = today;
        usedForgiveness = true;
      } else {
        // Streak broken
        streakData.currentStreak = 1;
      }
    }

    streakData.lastActiveDate = today;
    
    // Update longest streak
    if (streakData.currentStreak > streakData.longestStreak) {
      streakData.longestStreak = streakData.currentStreak;
    }

    data.streakData = streakData;
    await gamificationService.saveGamificationData(data);

    return {streak: streakData.currentStreak, usedForgiveness};
  },

  checkWeeklyReset: async (data: GamificationData) => {
    const today = new Date();
    const lastActive = new Date(data.streakData.lastActiveDate || today);
    const lastForgive = new Date(data.streakData.lastForgiveUseDate || lastActive);

    // Check if we're in a new week (Monday)
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
    weekStart.setHours(0, 0, 0, 0);

    const lastForgiveWeekStart = new Date(lastForgive);
    lastForgiveWeekStart.setDate(lastForgive.getDate() - lastForgive.getDay() + 1);
    lastForgiveWeekStart.setHours(0, 0, 0, 0);

    if (weekStart > lastForgiveWeekStart) {
      data.streakData.forgivenessPasses = WEEKLY_FORGIVENESS_PASSES;
      await gamificationService.saveGamificationData(data);
    }
  },

  // Quest Management
  generateWeeklyQuests: async (): Promise<Quest[]> => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
    endOfWeek.setHours(23, 59, 59, 999);

    // Randomly select 3 quests for the week
    const questTypes = Object.keys(QUEST_TEMPLATES) as QuestType[];
    const shuffled = questTypes.sort(() => 0.5 - Math.random());
    const selectedTypes = shuffled.slice(0, 3);

    const quests: Quest[] = selectedTypes.map(type => {
      const template = QUEST_TEMPLATES[type];
      return {
        id: `${type}_${startOfWeek.getTime()}`,
        name: template.name,
        description: template.description,
        type,
        target: template.target,
        current: 0,
        xpReward: template.xpReward,
        startDate: startOfWeek.toISOString(),
        endDate: endOfWeek.toISOString(),
        completed: false,
      };
    });

    return quests;
  },

  checkAndRefreshQuests: async () => {
    const data = await gamificationService.getGamificationData();
    const today = new Date();

    // Check if we need new quests (no active quests or quests expired)
    const needNewQuests =
      data.activeQuests.length === 0 ||
      data.activeQuests.every(
        quest => new Date(quest.endDate) < today,
      );

    if (needNewQuests) {
      // Archive old quests if any
      const oldCompletedQuests = data.activeQuests
        .filter(q => q.completed)
        .map(q => ({
          questId: q.id,
          questName: q.name,
          completedDate: new Date().toISOString(),
          xpEarned: q.xpReward,
        }));

      data.completedQuests.push(...oldCompletedQuests);

      // Generate new quests
      data.activeQuests = await gamificationService.generateWeeklyQuests();
      await gamificationService.saveGamificationData(data);
    }
  },

  updateQuestProgress: async (
    questType: QuestType,
    increment: number = 1,
  ): Promise<Quest | null> => {
    const data = await gamificationService.getGamificationData();
    const quest = data.activeQuests.find(q => q.type === questType && !q.completed);

    if (!quest) return null;

    quest.current += increment;

    // Check if quest is completed
    if (quest.current >= quest.target && !quest.completed) {
      quest.completed = true;
      await gamificationService.addXP(quest.xpReward, `Completed quest: ${quest.name}`);
      
      // Add completion record
      data.completedQuests.push({
        questId: quest.id,
        questName: quest.name,
        completedDate: new Date().toISOString(),
        xpEarned: quest.xpReward,
      });
    }

    await gamificationService.saveGamificationData(data);
    return quest;
  },

  // Check daily progress for quest tracking
  checkDailyQuestProgress: async (dailyData: any, userProfile: any) => {
    // Calculate totals from meals
    let totalFiber = 0;
    let totalSugar = 0;
    let totalProtein = 0;
    let totalCalories = 0;

    dailyData.meals.forEach((meal: any) => {
      meal.items.forEach((item: any) => {
        totalFiber += item.fiber_g || 0;
        totalSugar += item.sugar_g || 0;
        totalProtein += item.protein_g || 0;
        totalCalories += item.calories || 0;
      });
    });

    // Check fiber quest
    if (totalFiber >= 25) {
      await gamificationService.updateQuestProgress('fiber_intake');
    }

    // Check hydration quest
    if (dailyData.waterIntake >= userProfile.targetWater) {
      await gamificationService.updateQuestProgress('hydration');
    }

    // Check sugar quest
    if (totalSugar < 25) {
      await gamificationService.updateQuestProgress('no_sugar');
    }

    // Check protein quest
    if (totalProtein >= 100) {
      await gamificationService.updateQuestProgress('protein_intake');
    }

    // Check calorie target quest
    const calorieDeviation = Math.abs(totalCalories - userProfile.targetCalories);
    const tenPercent = userProfile.targetCalories * 0.1;
    if (calorieDeviation <= tenPercent) {
      await gamificationService.updateQuestProgress('calorie_target');
    }

    // Check meal logging quest (3+ meals per day)
    if (dailyData.meals.length >= 3) {
      await gamificationService.updateQuestProgress('meal_logging');
    }

    // Check step goal quest
    if (dailyData.steps >= userProfile.targetSteps) {
      await gamificationService.updateQuestProgress('step_goal');
    }
  },

  // Achievements
  unlockAchievement: async (achievement: Omit<Achievement, 'unlockedDate'>) => {
    const data = await gamificationService.getGamificationData();
    
    // Check if already unlocked
    if (data.achievements.some(a => a.id === achievement.id)) {
      return;
    }

    data.achievements.push({
      ...achievement,
      unlockedDate: new Date().toISOString(),
    });

    await gamificationService.saveGamificationData(data);
  },

  checkAchievements: async (gamData: GamificationData) => {
    // Check various achievement conditions
    if (gamData.level >= 10) {
      await gamificationService.unlockAchievement({
        id: 'level_10',
        name: 'Dedicated Tracker',
        description: 'Reached level 10',
        icon: '🏆',
      });
    }

    if (gamData.streakData.longestStreak >= 7) {
      await gamificationService.unlockAchievement({
        id: 'week_streak',
        name: 'Week Warrior',
        description: 'Maintained a 7-day streak',
        icon: '🔥',
      });
    }

    if (gamData.streakData.longestStreak >= 30) {
      await gamificationService.unlockAchievement({
        id: 'month_streak',
        name: 'Monthly Master',
        description: 'Maintained a 30-day streak',
        icon: '💪',
      });
    }

    if (gamData.completedQuests.length >= 10) {
      await gamificationService.unlockAchievement({
        id: 'quest_master',
        name: 'Quest Master',
        description: 'Completed 10 quests',
        icon: '⭐',
      });
    }
  },
};
