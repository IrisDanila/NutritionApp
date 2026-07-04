import {
  ActivityLevel,
  FoodEntry,
  GoalType,
  NutritionTargets,
  Profile,
} from '../store/types';
import {clamp, round} from '../utils/math';

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary (little/no exercise)',
  light: 'Light (1–3 days/week)',
  moderate: 'Moderate (3–5 days/week)',
  active: 'Active (6–7 days/week)',
  veryActive: 'Very active (physical job/2x day)',
};

export const GOAL_LABELS: Record<GoalType, string> = {
  lose: 'Lose weight',
  maintain: 'Maintain',
  gain: 'Build muscle',
};

/** Mifflin–St Jeor basal metabolic rate (kcal/day). */
export function bmr(p: Profile): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  return p.sex === 'male' ? base + 5 : base - 161;
}

/** Total daily energy expenditure. */
export function tdee(p: Profile): number {
  return bmr(p) * ACTIVITY_MULTIPLIER[p.activity];
}

/** Body Mass Index. */
export function bmi(p: Profile): number {
  const m = p.heightCm / 100;
  return p.weightKg / (m * m);
}

export function bmiCategory(value: number): {
  label: string;
  tone: 'success' | 'warning' | 'danger';
} {
  if (value < 18.5) return {label: 'Underweight', tone: 'warning'};
  if (value < 25) return {label: 'Healthy', tone: 'success'};
  if (value < 30) return {label: 'Overweight', tone: 'warning'};
  return {label: 'Obese', tone: 'danger'};
}

const GOAL_DELTA: Record<GoalType, number> = {
  lose: -500,
  maintain: 0,
  gain: 300,
};

/**
 * Computes daily targets. Macro split is goal-aware:
 *  - lose:   40C / 35P / 25F
 *  - maintain: 45C / 30P / 25F
 *  - gain:   45C / 30P / 25F (higher absolute protein from higher kcal)
 */
export function computeTargets(p: Profile): NutritionTargets {
  const maintenance = tdee(p);
  let calories =
    p.calorieTargetOverride && p.calorieTargetOverride > 0
      ? p.calorieTargetOverride
      : maintenance + GOAL_DELTA[p.goal];
  calories = clamp(Math.round(calories / 10) * 10, 1200, 4500);

  const split =
    p.goal === 'lose'
      ? {c: 0.4, pr: 0.35, f: 0.25}
      : {c: 0.45, pr: 0.3, f: 0.25};

  const carbs = round((calories * split.c) / 4);
  const protein = round((calories * split.pr) / 4);
  const fat = round((calories * split.f) / 9);

  // Water: 35 ml per kg, nudged up by activity.
  const waterMl =
    Math.round(
      (p.weightKg * 35 * (1 + (ACTIVITY_MULTIPLIER[p.activity] - 1.2) * 0.3)) /
        50,
    ) * 50;

  return {calories, carbs, protein, fat, waterMl};
}

export interface DayTotals {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
}

export function emptyTotals(): DayTotals {
  return {calories: 0, carbs: 0, protein: 0, fat: 0};
}

export function sumEntries(entries: FoodEntry[]): DayTotals {
  return entries.reduce<DayTotals>(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      carbs: acc.carbs + e.carbs,
      protein: acc.protein + e.protein,
      fat: acc.fat + e.fat,
    }),
    emptyTotals(),
  );
}

/** Energy distribution sanity for a single 100 kcal -> macro check (debug). */
export function caloriesFromMacros(t: DayTotals): number {
  return t.carbs * 4 + t.protein * 4 + t.fat * 9;
}
