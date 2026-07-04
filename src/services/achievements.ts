/**
 * Long-term achievements computed from the user's logged history.
 * Each unlock grants a one-off XP reward (claimed via the store, deduped by id).
 */
import {Diary, MeditationSession, WaterLog, WeightEntry, WorkoutEntry, NutritionTargets} from '../store/types';
import {sumEntries} from './nutrition';
import {addDays, keyToDate, todayKey} from '../utils/date';
import {levelInfo} from './levels';

export type AchievementCategory =
  | 'consistency'
  | 'hydration'
  | 'nutrition'
  | 'fitness'
  | 'mind'
  | 'progression';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  xp: number;
  target: number;
  current: number;
  unlocked: boolean;
}

export interface AchievementData {
  diary: Diary;
  water: WaterLog;
  meditations: MeditationSession[];
  workouts: WorkoutEntry[];
  weights: WeightEntry[];
  targets: NutritionTargets | null;
  xp: number;
  challengesCompleted: number;
}

const weekBucket = (dateKey: string) =>
  Math.floor(keyToDate(dateKey).getTime() / (7 * 86400000));

function currentStreak(pred: (k: string) => boolean): number {
  let streak = 0;
  let cur = todayKey();
  if (!pred(cur)) cur = addDays(cur, -1);
  // Cap the look-back so we never loop unbounded.
  for (let i = 0; i < 1000 && pred(cur); i++) {
    streak++;
    cur = addDays(cur, -1);
  }
  return streak;
}

interface Stats {
  foodDays: number;
  foodStreak: number;
  waterGoalDays: number;
  waterStreak: number;
  underCalDays: number;
  underCalStreak: number;
  proteinDays: number;
  medCount: number;
  medMinutes: number;
  workoutCount: number;
  workoutDays: number;
  workoutWeeks: number; // weeks with >= 3 workout days
  weightWeeks: number;
  level: number;
  challengesCompleted: number;
}

function computeStats(d: AchievementData): Stats {
  const t = d.targets;
  const dayCals = (k: string) => sumEntries(d.diary[k] ?? []);
  const loggedDays = Object.keys(d.diary).filter(k => (d.diary[k] ?? []).length > 0);

  const waterGoalDays = t
    ? Object.keys(d.water).filter(k => (d.water[k] ?? 0) >= t.waterMl).length
    : 0;

  const underCalDays = t
    ? loggedDays.filter(k => {
        const c = dayCals(k).calories;
        return c > 0 && c <= t.calories;
      }).length
    : 0;

  const proteinDays = t
    ? loggedDays.filter(k => dayCals(k).protein >= t.protein).length
    : 0;

  // Workout day buckets per week.
  const workoutDaysByWeek = new Map<number, Set<string>>();
  d.workouts.forEach(w => {
    const b = weekBucket(w.dateKey);
    if (!workoutDaysByWeek.has(b)) workoutDaysByWeek.set(b, new Set());
    workoutDaysByWeek.get(b)!.add(w.dateKey);
  });
  const workoutWeeks = [...workoutDaysByWeek.values()].filter(s => s.size >= 3).length;
  const workoutDays = new Set(d.workouts.map(w => w.dateKey)).size;

  const weightWeeks = new Set(d.weights.map(w => weekBucket(w.dateKey))).size;

  return {
    foodDays: loggedDays.length,
    foodStreak: currentStreak(k => (d.diary[k] ?? []).length > 0),
    waterGoalDays,
    waterStreak: currentStreak(k => !!t && (d.water[k] ?? 0) >= t.waterMl),
    underCalDays,
    underCalStreak: currentStreak(k => {
      if (!t) return false;
      const c = dayCals(k).calories;
      return c > 0 && c <= t.calories;
    }),
    proteinDays,
    medCount: d.meditations.length,
    medMinutes: Math.round(d.meditations.reduce((a, m) => a + m.durationSec, 0) / 60),
    workoutCount: d.workouts.length,
    workoutDays,
    workoutWeeks,
    weightWeeks,
    level: levelInfo(d.xp).level,
    challengesCompleted: d.challengesCompleted,
  };
}

export function computeAchievements(d: AchievementData): Achievement[] {
  const s = computeStats(d);

  const defs: Omit<Achievement, 'unlocked'>[] = [
    // Consistency
    a('first_log', 'First Bite', 'Log your very first food', 'consistency', 'silverware-fork-knife', 50, 1, Math.min(1, s.foodDays)),
    a('log_7', 'Getting Started', 'Log food on 7 days', 'consistency', 'notebook', 75, 7, s.foodDays),
    a('log_30', 'Dedicated', 'Log food on 30 days', 'consistency', 'notebook-check', 150, 30, s.foodDays),
    a('log_100', 'Centurion', 'Log food on 100 days', 'consistency', 'crown', 400, 100, s.foodDays),
    a('streak_7', 'Week Warrior', '7-day logging streak', 'consistency', 'fire', 100, 7, s.foodStreak),
    a('streak_30', 'Unstoppable', '30-day logging streak', 'consistency', 'fire', 300, 30, s.foodStreak),

    // Hydration
    a('water_1', 'First Drop', 'Hit your water goal once', 'hydration', 'cup-water', 40, 1, s.waterGoalDays),
    a('water_7', 'Well Hydrated', 'Hit your water goal 7 times', 'hydration', 'water-check', 100, 7, s.waterGoalDays),
    a('water_30', 'Aqua Master', 'Hit your water goal 30 times', 'hydration', 'water', 250, 30, s.waterGoalDays),
    a('water_streak_7', 'Hydration Habit', '7 days in a row at goal', 'hydration', 'water-plus', 150, 7, s.waterStreak),

    // Nutrition
    a('under_7', 'On Target', 'Stay under calories 7 days in a row', 'nutrition', 'scale-balance', 120, 7, s.underCalStreak),
    a('under_14', 'Two-Week Discipline', 'Stay under calories 14 days in a row', 'nutrition', 'scale-balance', 280, 14, s.underCalStreak),
    a('budget_30', 'Calorie Conscious', 'Stay under calories on 30 days total', 'nutrition', 'check-decagram', 250, 30, s.underCalDays),
    a('protein_7', 'Protein Pro', 'Hit your protein goal on 7 days', 'nutrition', 'food-drumstick', 120, 7, s.proteinDays),

    // Fitness / Gym
    a('workout_first', 'First Rep', 'Log your first workout', 'fitness', 'dumbbell', 40, 1, s.workoutCount),
    a('gym_7', 'Warming Up', 'Work out on 7 days', 'fitness', 'arm-flex', 100, 7, s.workoutDays),
    a('gym_30', 'Gym Regular', 'Work out on 30 days (~1 month)', 'fitness', 'weight-lifter', 250, 30, s.workoutDays),
    a('gym_90', 'Iron Discipline', 'Work out on 90 days (~3 months)', 'fitness', 'trophy-variant', 600, 90, s.workoutDays),
    a('gym_weeks_4', 'Consistent Athlete', '3+ workouts/week for 4 weeks', 'fitness', 'calendar-star', 300, 4, s.workoutWeeks),

    // Mind
    a('med_first', 'First Breath', 'Complete a meditation', 'mind', 'meditation', 40, 1, s.medCount),
    a('med_10', 'Mindful', 'Complete 10 sessions', 'mind', 'spa', 100, 10, s.medCount),
    a('med_30', 'Zen Master', 'Complete 30 sessions', 'mind', 'lotus', 250, 30, s.medCount),
    a('med_hours', 'Inner Calm', 'Meditate for 5 hours total', 'mind', 'timer-sand', 200, 300, s.medMinutes),

    // Progression
    a('weight_4w', 'Tracking Progress', 'Weigh in across 4 weeks', 'progression', 'scale-bathroom', 120, 4, s.weightWeeks),
    a('quests_10', 'Quest Seeker', 'Complete 10 daily challenges', 'progression', 'flag-checkered', 100, 10, s.challengesCompleted),
    a('quests_50', 'Quest Master', 'Complete 50 daily challenges', 'progression', 'flag-variant', 350, 50, s.challengesCompleted),
    a('level_5', 'Rising Star', 'Reach level 5', 'progression', 'star', 100, 5, s.level),
    a('level_10', 'High Achiever', 'Reach level 10', 'progression', 'star-four-points', 250, 10, s.level),
    a('level_20', 'Elite', 'Reach level 20', 'progression', 'crown', 600, 20, s.level),
  ];

  return defs.map(def => ({...def, unlocked: def.current >= def.target}));
}

function a(
  id: string,
  title: string,
  description: string,
  category: AchievementCategory,
  icon: string,
  xp: number,
  target: number,
  current: number,
): Omit<Achievement, 'unlocked'> {
  return {id, title, description, category, icon, xp, target, current: Math.min(current, target)};
}
