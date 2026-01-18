import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NutritionItem {
  name: string;
  calories: number;
  serving_size_g: number;
  fat_total_g: number;
  fat_saturated_g?: number;
  protein_g: number;
  sodium_mg?: number;
  potassium_mg?: number;
  cholesterol_mg?: number;
  carbohydrates_total_g: number;
  fiber_g: number;
  sugar_g: number;
}

export interface MealEntry {
  id: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  items: NutritionItem[];
  timestamp: number;
}

export interface Activity {
  id: string;
  name: string;
  duration: number; // in minutes
  caloriesBurned: number;
  timestamp: number;
}

export interface DailyData {
  date: string;
  meals: MealEntry[];
  activities: Activity[];
  waterIntake: number; // in ml
  steps: number;
  notes: string;
}

export interface UserProfile {
  name: string;
  age: number;
  weight: number; // in kg
  height: number; // in cm
  goal: 'lose' | 'maintain' | 'gain';
  gender: 'male' | 'female';
  targetCalories: number;
  targetWater: number; // in ml
  targetSteps: number;
}

export interface MeditationLog {
  id: string;
  durationSec: number;
  timestamp: number;
  location?: {
    city?: string;
    region?: string;
    country?: string;
  };
}

export type ThemeMode = 'light' | 'dark';

export interface FoodHistory {
  id: string;
  items: NutritionItem[];
  timestamp: number;
  imageUri?: string;
}

const KEYS = {
  DAILY_DATA: 'daily_data_',
  USER_PROFILE: 'user_profile',
  STREAK: 'streak_data',
  FOOD_HISTORY: 'food_history',
  MEDITATION_LOGS: 'meditation_logs',
  THEME_PREFERENCE: 'theme_preference',
  ONBOARDING_COMPLETE: 'onboarding_complete',
};

export const storageService = {
  // Daily Data
  saveDailyData: async (date: string, data: DailyData) => {
    try {
      await AsyncStorage.setItem(
        `${KEYS.DAILY_DATA}${date}`,
        JSON.stringify(data),
      );
    } catch (error) {
      console.error('Error saving daily data:', error);
    }
  },

  getDailyData: async (date: string): Promise<DailyData> => {
    try {
      const data = await AsyncStorage.getItem(`${KEYS.DAILY_DATA}${date}`);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error getting daily data:', error);
    }
    return {
      date,
      meals: [],
      activities: [],
      waterIntake: 0,
      steps: 0,
      notes: '',
    };
  },

  getEarliestDailyDataDate: async (): Promise<string | null> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const dates = keys
        .filter(key => key.startsWith(KEYS.DAILY_DATA))
        .map(key => key.replace(KEYS.DAILY_DATA, ''))
        .filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date))
        .sort();
      return dates.length > 0 ? dates[0] : null;
    } catch (error) {
      console.error('Error getting earliest daily data date:', error);
      return null;
    }
  },

  // User Profile
  saveUserProfile: async (profile: UserProfile) => {
    try {
      await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
  },

  getUserProfile: async (): Promise<UserProfile> => {
    const defaultProfile: UserProfile = {
      name: 'User',
      age: 25,
      weight: 70,
      height: 170,
      goal: 'maintain',
      gender: 'male',
      targetCalories: 2000,
      targetWater: 2000,
      targetSteps: 10000,
    };
    try {
      const data = await AsyncStorage.getItem(KEYS.USER_PROFILE);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          ...defaultProfile,
          ...parsed,
          gender: parsed.gender ?? defaultProfile.gender,
        };
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
    }
    return defaultProfile;
  },

  getOnboardingComplete: async (): Promise<boolean> => {
    try {
      const value = await AsyncStorage.getItem(KEYS.ONBOARDING_COMPLETE);
      return value === 'true';
    } catch (error) {
      console.error('Error getting onboarding status:', error);
      return false;
    }
  },

  setOnboardingComplete: async () => {
    try {
      await AsyncStorage.setItem(KEYS.ONBOARDING_COMPLETE, 'true');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  },

  // Streak
  updateStreak: async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const streakData = await AsyncStorage.getItem(KEYS.STREAK);
      let streak = 1;
      let lastDate = today;

      if (streakData) {
        const {currentStreak, lastActiveDate} = JSON.parse(streakData);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastActiveDate === today) {
          return currentStreak;
        } else if (lastActiveDate === yesterdayStr) {
          streak = currentStreak + 1;
        } else {
          streak = 1;
        }
      }

      await AsyncStorage.setItem(
        KEYS.STREAK,
        JSON.stringify({currentStreak: streak, lastActiveDate: today}),
      );
      return streak;
    } catch (error) {
      console.error('Error updating streak:', error);
      return 1;
    }
  },

  getStreak: async (): Promise<number> => {
    try {
      const streakData = await AsyncStorage.getItem(KEYS.STREAK);
      if (streakData) {
        const {currentStreak} = JSON.parse(streakData);
        return currentStreak;
      }
    } catch (error) {
      console.error('Error getting streak:', error);
    }
    return 0;
  },

  // Food History
  addFoodHistory: async (items: NutritionItem[], imageUri?: string) => {
    try {
      const history = await storageService.getFoodHistory();
      const newEntry: FoodHistory = {
        id: Date.now().toString(),
        items,
        timestamp: Date.now(),
        imageUri,
      };
      history.unshift(newEntry);
      await AsyncStorage.setItem(KEYS.FOOD_HISTORY, JSON.stringify(history));
    } catch (error) {
      console.error('Error adding food history:', error);
    }
  },

  getFoodHistory: async (): Promise<FoodHistory[]> => {
    try {
      const data = await AsyncStorage.getItem(KEYS.FOOD_HISTORY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error getting food history:', error);
    }
    return [];
  },

  // Theme preference
  getThemePreference: async (): Promise<ThemeMode> => {
    try {
      const value = await AsyncStorage.getItem(KEYS.THEME_PREFERENCE);
      if (value === 'dark' || value === 'light') {
        return value;
      }
    } catch (error) {
      console.error('Error getting theme preference:', error);
    }
    return 'light';
  },

  setThemePreference: async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(KEYS.THEME_PREFERENCE, mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  },

  // Meditation Logs
  addMeditationLog: async (log: Omit<MeditationLog, 'id'>) => {
    try {
      const logs = await storageService.getMeditationLogs();
      const newEntry: MeditationLog = {
        id: Date.now().toString(),
        ...log,
      };
      logs.unshift(newEntry);
      await AsyncStorage.setItem(KEYS.MEDITATION_LOGS, JSON.stringify(logs));
    } catch (error) {
      console.error('Error adding meditation log:', error);
    }
  },

  getMeditationLogs: async (): Promise<MeditationLog[]> => {
    try {
      const data = await AsyncStorage.getItem(KEYS.MEDITATION_LOGS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error getting meditation logs:', error);
    }
    return [];
  },

  // Add meal to daily data
  addMeal: async (
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    items: NutritionItem[],
  ) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const dailyData = await storageService.getDailyData(today);
      const newMeal: MealEntry = {
        id: Date.now().toString(),
        type: mealType,
        items,
        timestamp: Date.now(),
      };
      dailyData.meals.push(newMeal);
      await storageService.saveDailyData(today, dailyData);
      await storageService.updateStreak();
    } catch (error) {
      console.error('Error adding meal:', error);
    }
  },

  // Add activity
  addActivity: async (activity: Omit<Activity, 'id' | 'timestamp'>) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const dailyData = await storageService.getDailyData(today);
      const newActivity: Activity = {
        ...activity,
        id: Date.now().toString(),
        timestamp: Date.now(),
      };
      dailyData.activities.push(newActivity);
      await storageService.saveDailyData(today, dailyData);
    } catch (error) {
      console.error('Error adding activity:', error);
    }
  },

  // Update water intake
  updateWaterIntake: async (amount: number) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const dailyData = await storageService.getDailyData(today);
      dailyData.waterIntake += amount;
      await storageService.saveDailyData(today, dailyData);
    } catch (error) {
      console.error('Error updating water intake:', error);
    }
  },

  // Update steps
  updateSteps: async (steps: number) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const dailyData = await storageService.getDailyData(today);
      dailyData.steps = steps;
      await storageService.saveDailyData(today, dailyData);
    } catch (error) {
      console.error('Error updating steps:', error);
    }
  },

  // Update notes
  updateNotes: async (notes: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const dailyData = await storageService.getDailyData(today);
      dailyData.notes = notes;
      await storageService.saveDailyData(today, dailyData);
    } catch (error) {
      console.error('Error updating notes:', error);
    }
  },
};
