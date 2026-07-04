/** Domain model for NutriLife. */

export type Sex = 'male' | 'female';

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'veryActive';

export type GoalType = 'lose' | 'maintain' | 'gain';

export type UnitSystem = 'metric' | 'imperial';

export type ThemeMode = 'light' | 'dark' | 'system';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Profile {
  name: string;
  sex: Sex;
  age: number; // years
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  goal: GoalType;
  // Optional manual override of computed daily calorie target.
  calorieTargetOverride?: number | null;
}

/** A single logged food item. Macros are absolute grams for the eaten amount. */
export interface FoodEntry {
  id: string;
  name: string;
  meal: MealType;
  /** ISO timestamp of when it was logged. */
  loggedAt: string;
  /** Amount eaten and the unit label (e.g. "g", "cup", "serving"). */
  amount: number;
  unit: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  /** Source of the data, for transparency. */
  source: 'usda' | 'ai-scan' | 'manual';
  /** USDA fdcId if applicable. */
  fdcId?: number;
  /** Confidence 0..1 if it came from the AI scanner. */
  confidence?: number;
}

export interface WeightEntry {
  id: string;
  dateKey: string; // YYYY-MM-DD
  weightKg: number;
  loggedAt: string;
}

export interface MeditationSession {
  id: string;
  dateKey: string;
  preset: string; // e.g. "Box Breathing"
  durationSec: number;
  loggedAt: string;
}

export type WorkoutType =
  | 'gym'
  | 'run'
  | 'cycle'
  | 'yoga'
  | 'swim'
  | 'sport'
  | 'walk'
  | 'other';

export interface WorkoutEntry {
  id: string;
  dateKey: string;
  type: WorkoutType;
  durationMin: number;
  loggedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  /** true while the assistant message is still streaming. */
  pending?: boolean;
}

export interface NutritionTargets {
  calories: number;
  carbs: number; // grams
  protein: number; // grams
  fat: number; // grams
  waterMl: number;
}

export interface Settings {
  themeMode: ThemeMode;
  units: UnitSystem;
  usdaApiKey: string;
  enableAICoach: boolean;
  enableAIScanner: boolean;
  waterCupMl: number; // size of one "cup" tap
  stepGoal: number; // daily step target
  reminderWaterEnabled: boolean;
  reminderWaterIntervalMin: number; // minutes between water nudges
  reminderMealsEnabled: boolean; // breakfast/lunch/dinner reminders
  reminderQuestEnabled: boolean; // daily "new quests" reminder
}

/** Per-day diary keyed by YYYY-MM-DD. */
export type Diary = Record<string, FoodEntry[]>;
export type WaterLog = Record<string, number>; // ml per day
