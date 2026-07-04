import {useMemo} from 'react';
import {useAppStore} from '../store/useAppStore';
import {computeTargets, DayTotals, emptyTotals, sumEntries} from '../services/nutrition';
import {NutritionTargets} from '../store/types';
import {addDays, todayKey} from '../utils/date';

export function useTargets(): NutritionTargets | null {
  const profile = useAppStore(s => s.profile);
  return useMemo(() => (profile ? computeTargets(profile) : null), [profile]);
}

export function useDayEntries(dateKey: string) {
  return useAppStore(s => s.diary[dateKey] ?? []);
}

export function useDayTotals(dateKey: string): DayTotals {
  const entries = useDayEntries(dateKey);
  return useMemo(() => (entries.length ? sumEntries(entries) : emptyTotals()), [entries]);
}

export function useWaterToday(dateKey: string): number {
  return useAppStore(s => s.water[dateKey] ?? 0);
}

/** Consecutive days (ending today or yesterday) with at least one food logged. */
export function useStreak(): number {
  const diary = useAppStore(s => s.diary);
  return useMemo(() => {
    let streak = 0;
    let cursor = todayKey();
    // Allow the streak to "hold" if today is empty but yesterday was logged.
    if (!(diary[cursor]?.length)) cursor = addDays(cursor, -1);
    while (diary[cursor]?.length) {
      streak += 1;
      cursor = addDays(cursor, -1);
    }
    return streak;
  }, [diary]);
}
