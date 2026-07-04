import {useEffect, useMemo} from 'react';
import {useAppStore} from '../store/useAppStore';
import {useTargets} from './useNutrition';
import {todayKey} from '../utils/date';
import {sumEntries} from '../services/nutrition';
import {levelInfo, LevelInfo} from '../services/levels';
import {
  Challenge,
  ChallengeContext,
  getDailyChallenges,
  isChallengeComplete,
} from '../services/challenges';
import {Achievement, computeAchievements} from '../services/achievements';

export interface DailyChallenge {
  challenge: Challenge;
  complete: boolean;
  claimed: boolean;
}

export interface GamificationState {
  level: LevelInfo;
  challenges: DailyChallenge[];
  achievements: Achievement[];
  completedToday: number;
  earnedTodayXp: number;
  toggleManual: (id: string) => void;
}

/**
 * Central gamification hook. Computes the day's challenges + achievements and
 * auto-claims XP for anything newly completed/unlocked (idempotent via the
 * store's claim sets, so mounting it on multiple screens is safe).
 */
export function useGamification(): GamificationState {
  const today = todayKey();
  const targets = useTargets();

  const diary = useAppStore(s => s.diary);
  const water = useAppStore(s => s.water);
  const meditations = useAppStore(s => s.meditations);
  const workouts = useAppStore(s => s.workouts);
  const weights = useAppStore(s => s.weights);
  const xp = useAppStore(s => s.xp);
  const challengesCompleted = useAppStore(s => s.challengesCompleted);

  const manualToday = useAppStore(s => s.manualChallenges[today]);
  const claimsToday = useAppStore(s => s.challengeXpClaims[today]);
  const achievementClaims = useAppStore(s => s.achievementClaims);

  const toggleManualChallenge = useAppStore(s => s.toggleManualChallenge);
  const claimChallengeXp = useAppStore(s => s.claimChallengeXp);
  const claimAchievement = useAppStore(s => s.claimAchievement);

  const ctx: ChallengeContext = useMemo(() => {
    const entries = diary[today] ?? [];
    const medMin = meditations
      .filter(m => m.dateKey === today)
      .reduce((a, m) => a + m.durationSec, 0) / 60;
    const todayWorkouts = workouts.filter(w => w.dateKey === today);
    return {
      waterMl: water[today] ?? 0,
      targets,
      totals: sumEntries(entries),
      foodCount: entries.length,
      meditationMin: medMin,
      workoutMin: todayWorkouts.reduce((a, w) => a + w.durationMin, 0),
      workoutCount: todayWorkouts.length,
      weighedToday: weights.some(w => w.dateKey === today),
    };
  }, [diary, water, meditations, workouts, weights, targets, today]);

  const challenges: DailyChallenge[] = useMemo(() => {
    const manual = manualToday ?? [];
    const claimed = claimsToday ?? [];
    return getDailyChallenges(today).map(challenge => ({
      challenge,
      complete: isChallengeComplete(challenge, ctx, manual),
      claimed: claimed.includes(challenge.id),
    }));
  }, [ctx, manualToday, claimsToday, today]);

  const achievements = useMemo(
    () =>
      computeAchievements({
        diary,
        water,
        meditations,
        workouts,
        weights,
        targets,
        xp,
        challengesCompleted,
      }),
    [diary, water, meditations, workouts, weights, targets, xp, challengesCompleted],
  );

  // Auto-claim completed challenges.
  const challengeClaimSig = challenges
    .filter(c => c.complete && !c.claimed)
    .map(c => c.challenge.id)
    .join(',');
  useEffect(() => {
    challenges.forEach(c => {
      if (c.complete && !c.claimed) {
        claimChallengeXp(today, c.challenge.id, c.challenge.xp);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeClaimSig]);

  // Auto-claim unlocked achievements.
  const achievementClaimSig = achievements
    .filter(a => a.unlocked && !achievementClaims.includes(a.id))
    .map(a => a.id)
    .join(',');
  useEffect(() => {
    achievements.forEach(ach => {
      if (ach.unlocked && !achievementClaims.includes(ach.id)) {
        claimAchievement(ach.id, ach.xp);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [achievementClaimSig]);

  return {
    level: levelInfo(xp),
    challenges,
    achievements,
    completedToday: challenges.filter(c => c.complete).length,
    earnedTodayXp: challenges
      .filter(c => c.claimed)
      .reduce((a, c) => a + c.challenge.xp, 0),
    toggleManual: (id: string) => toggleManualChallenge(today, id),
  };
}
