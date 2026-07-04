/**
 * XP / level system.
 *
 * Level L starts at cumulative XP = 50 * L * (L - 1):
 *   L1: 0, L2: 100, L3: 300, L4: 600, L5: 1000 …
 * So advancing from level L costs 100 * L XP (gaps grow over time).
 */

export interface LevelInfo {
  level: number;
  /** XP accumulated within the current level. */
  xpIntoLevel: number;
  /** XP required to advance from the current level. */
  xpForNext: number;
  /** 0..1 progress through the current level. */
  progress: number;
  rank: Rank;
  totalXp: number;
}

export interface Rank {
  title: string;
  color: string; // hex
  icon: string; // MaterialCommunityIcons name
}

const cumulativeForLevel = (level: number) => 50 * level * (level - 1);

const RANKS: {minLevel: number; rank: Rank}[] = [
  {minLevel: 25, rank: {title: 'Legend', color: '#FFB300', icon: 'crown'}},
  {minLevel: 17, rank: {title: 'Champion', color: '#9C5BFF', icon: 'trophy-variant'}},
  {minLevel: 12, rank: {title: 'Athlete', color: '#FF6B8B', icon: 'arm-flex'}},
  {minLevel: 8, rank: {title: 'Achiever', color: '#3D7BFF', icon: 'medal'}},
  {minLevel: 5, rank: {title: 'Grower', color: '#16A571', icon: 'sprout'}},
  {minLevel: 3, rank: {title: 'Seedling', color: '#3AB7E8', icon: 'leaf'}},
  {minLevel: 1, rank: {title: 'Sprout', color: '#7FB069', icon: 'seed'}},
];

export function rankForLevel(level: number): Rank {
  return (RANKS.find(r => level >= r.minLevel) ?? RANKS[RANKS.length - 1]).rank;
}

export function levelInfo(totalXp: number): LevelInfo {
  const xp = Math.max(0, Math.floor(totalXp));
  let level = 1;
  while (cumulativeForLevel(level + 1) <= xp) level++;

  const base = cumulativeForLevel(level);
  const xpForNext = 100 * level;
  const xpIntoLevel = xp - base;

  return {
    level,
    xpIntoLevel,
    xpForNext,
    progress: Math.min(1, xpIntoLevel / xpForNext),
    rank: rankForLevel(level),
    totalXp: xp,
  };
}
