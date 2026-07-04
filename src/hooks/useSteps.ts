import {useCallback, useEffect, useState} from 'react';
import {AppState} from 'react-native';
import {useAppStore} from '../store/useAppStore';
import {todayKey} from '../utils/date';
import {
  ensureStepPermission,
  isStepSensorAvailable,
  readCumulativeSteps,
} from '../services/steps';

export interface StepState {
  steps: number;
  goal: number;
  progress: number;
  available: boolean | null;
}

/**
 * Samples the hardware step counter on mount and whenever the app returns to
 * the foreground, and stores today's count in the app store.
 */
export function useSteps(): StepState {
  const stepsByDay = useAppStore(s => s.steps);
  const record = useAppStore(s => s.recordCumulativeSteps);
  const goal = useAppStore(s => s.settings.stepGoal);
  const [available, setAvailable] = useState<boolean | null>(null);

  const sample = useCallback(async () => {
    const ok = await isStepSensorAvailable();
    setAvailable(ok);
    if (!ok) return;
    if (!(await ensureStepPermission())) return;
    const cumulative = await readCumulativeSteps();
    // The native module returns -1 until the first sensor event arrives.
    if (cumulative != null && cumulative >= 0) record(cumulative);
  }, [record]);

  useEffect(() => {
    sample();
    const sub = AppState.addEventListener('change', s => {
      if (s === 'active') sample();
    });
    // Poll while the app is open so the count climbs as you walk.
    const interval = setInterval(sample, 10000);
    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, [sample]);

  const steps = stepsByDay[todayKey()] ?? 0;
  return {
    steps,
    goal,
    progress: goal > 0 ? Math.min(1, steps / goal) : 0,
    available,
  };
}
