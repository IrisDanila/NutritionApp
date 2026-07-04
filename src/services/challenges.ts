/**
 * Daily challenge system. A fixed pool of hand-written challenges spanning
 * hydration / nutrition / fitness / mind. Each day we deterministically pick 3
 * (seeded by the date so they stay stable across app restarts), preferring
 * distinct categories for variety.
 *
 * Challenges are either:
 *   - `auto`   : completion derived from tracked data (water, macros, workouts…)
 *   - `manual` : the user taps to mark it done
 */
import {DayTotals} from './nutrition';
import {NutritionTargets} from '../store/types';

export type ChallengeCategory = 'hydration' | 'nutrition' | 'fitness' | 'mind';

export interface ChallengeContext {
  waterMl: number;
  targets: NutritionTargets | null;
  totals: DayTotals;
  foodCount: number;
  meditationMin: number;
  workoutMin: number;
  workoutCount: number;
  weighedToday: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: ChallengeCategory;
  icon: string; // MaterialCommunityIcons
  xp: number;
  type: 'auto' | 'manual';
  auto?: (ctx: ChallengeContext) => boolean;
}

export const CATEGORY_META: Record<
  ChallengeCategory,
  {label: string; color: string; icon: string}
> = {
  hydration: {label: 'Hydration', color: '#3AB7E8', icon: 'cup-water'},
  nutrition: {label: 'Nutrition', color: '#16A571', icon: 'food-apple'},
  fitness: {label: 'Fitness', color: '#FF7A59', icon: 'dumbbell'},
  mind: {label: 'Mind', color: '#9C5BFF', icon: 'meditation'},
};

export const CHALLENGE_POOL: Challenge[] = [
  // Hydration
  {id: 'h_2l', title: 'Hydration Hero', description: 'Drink 2 litres of water today', category: 'hydration', icon: 'cup-water', xp: 40, type: 'auto', auto: c => c.waterMl >= 2000},
  {id: 'h_goal', title: 'Hit Your Water Goal', description: 'Reach your daily water target', category: 'hydration', icon: 'water-check', xp: 35, type: 'auto', auto: c => !!c.targets && c.waterMl >= c.targets.waterMl},
  {id: 'h_wake', title: 'Morning Sip', description: 'Start the day with a glass of water', category: 'hydration', icon: 'weather-sunset-up', xp: 20, type: 'manual'},
  {id: 'h_swap', title: 'Smart Swap', description: 'Swap a sugary drink for water', category: 'hydration', icon: 'bottle-soda', xp: 25, type: 'manual'},

  // Nutrition
  {id: 'n_protein', title: 'Protein Power', description: 'Hit your daily protein target', category: 'nutrition', icon: 'food-drumstick', xp: 50, type: 'auto', auto: c => !!c.targets && c.totals.protein >= c.targets.protein},
  {id: 'n_budget', title: 'On Budget', description: 'Stay within your calorie target', category: 'nutrition', icon: 'scale-balance', xp: 45, type: 'auto', auto: c => !!c.targets && c.totals.calories > 0 && c.totals.calories <= c.targets.calories},
  {id: 'n_3meals', title: 'Three Square Meals', description: 'Log at least 3 foods today', category: 'nutrition', icon: 'silverware-fork-knife', xp: 30, type: 'auto', auto: c => c.foodCount >= 3},
  {id: 'n_veg', title: 'Eat Your Greens', description: 'Eat 2 servings of vegetables', category: 'nutrition', icon: 'carrot', xp: 30, type: 'manual'},
  {id: 'n_nofast', title: 'Clean Day', description: 'No fast food today', category: 'nutrition', icon: 'food-off', xp: 35, type: 'manual'},
  {id: 'n_fruit', title: 'Fruit Fix', description: 'Eat a piece of fruit', category: 'nutrition', icon: 'fruit-cherries', xp: 20, type: 'manual'},
  {id: 'n_cook', title: 'Home Chef', description: 'Cook a meal at home', category: 'nutrition', icon: 'chef-hat', xp: 30, type: 'manual'},

  // Fitness
  {id: 'f_30min', title: 'Get Moving', description: 'Exercise for 30 minutes', category: 'fitness', icon: 'run-fast', xp: 50, type: 'auto', auto: c => c.workoutMin >= 30},
  {id: 'f_workout', title: 'Hit the Gym', description: 'Log a workout today', category: 'fitness', icon: 'dumbbell', xp: 35, type: 'auto', auto: c => c.workoutCount >= 1},
  {id: 'f_pushups', title: 'Push It', description: 'Do 20 push-ups', category: 'fitness', icon: 'arm-flex', xp: 30, type: 'manual'},
  {id: 'f_walk', title: 'Step Out', description: 'Take a 10-minute walk', category: 'fitness', icon: 'walk', xp: 20, type: 'manual'},
  {id: 'f_stretch', title: 'Loosen Up', description: 'Stretch for 5 minutes', category: 'fitness', icon: 'yoga', xp: 20, type: 'manual'},
  {id: 'f_stairs', title: 'Take the Stairs', description: 'Skip the elevator today', category: 'fitness', icon: 'stairs', xp: 20, type: 'manual'},
  {id: 'f_weigh', title: 'Track Progress', description: 'Log your weight today', category: 'fitness', icon: 'scale-bathroom', xp: 25, type: 'auto', auto: c => c.weighedToday},

  // Mind
  {id: 'm_med10', title: 'Find Your Calm', description: 'Meditate for 10 minutes', category: 'mind', icon: 'meditation', xp: 40, type: 'auto', auto: c => c.meditationMin >= 10},
  {id: 'm_breath', title: 'Just Breathe', description: 'Do a breathing session', category: 'mind', icon: 'air-filter', xp: 25, type: 'auto', auto: c => c.meditationMin >= 1},
  {id: 'm_gratitude', title: 'Gratitude', description: "Note 3 things you're grateful for", category: 'mind', icon: 'heart', xp: 30, type: 'manual'},
  {id: 'm_sleep', title: 'Rest Well', description: 'Get 7+ hours of sleep', category: 'mind', icon: 'sleep', xp: 30, type: 'manual'},
  {id: 'm_screen', title: 'Digital Sunset', description: 'No screens 30 min before bed', category: 'mind', icon: 'cellphone-off', xp: 25, type: 'manual'},
  {id: 'm_outside', title: 'Fresh Air', description: 'Step outside for some fresh air', category: 'mind', icon: 'pine-tree', xp: 20, type: 'manual'},
];

const CATEGORIES: ChallengeCategory[] = ['hydration', 'nutrition', 'fitness', 'mind'];

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Deterministically pick 3 challenges for a given date, across categories. */
export function getDailyChallenges(dateKey: string): Challenge[] {
  const rng = mulberry32(hashString(`nutrilife-quests-${dateKey}`));
  const cats = shuffle(CATEGORIES, rng);
  const chosen: Challenge[] = [];

  for (const cat of cats) {
    if (chosen.length >= 3) break;
    const pool = CHALLENGE_POOL.filter(c => c.category === cat);
    if (pool.length === 0) continue;
    chosen.push(pool[Math.floor(rng() * pool.length)]);
  }
  while (chosen.length < 3) {
    const rest = CHALLENGE_POOL.filter(c => !chosen.includes(c));
    if (rest.length === 0) break;
    chosen.push(rest[Math.floor(rng() * rest.length)]);
  }
  return chosen;
}

export function isChallengeComplete(
  challenge: Challenge,
  ctx: ChallengeContext,
  manualDone: string[],
): boolean {
  if (challenge.type === 'manual') return manualDone.includes(challenge.id);
  return challenge.auto ? challenge.auto(ctx) : false;
}
