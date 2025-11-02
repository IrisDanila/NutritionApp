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
  targetCalories: number;
  targetWater: number; // in ml
  targetSteps: number;
}

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

  // User Profile
  saveUserProfile: async (profile: UserProfile) => {
    try {
      await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
  },

  getUserProfile: async (): Promise<UserProfile> => {
    try {
      const data = await AsyncStorage.getItem(KEYS.USER_PROFILE);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
    }
    return {
      name: 'User',
      age: 25,
      weight: 70,
      height: 170,
      goal: 'maintain',
      targetCalories: 2000,
      targetWater: 2000,
      targetSteps: 10000,
    };
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
