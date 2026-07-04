import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ChatMessage,
  Diary,
  FoodEntry,
  MeditationSession,
  Profile,
  Settings,
  WaterLog,
  WeightEntry,
  WorkoutEntry,
  WorkoutType,
} from './types';
import {todayKey} from '../utils/date';
import {uid} from '../utils/id';

const DEFAULT_USDA_KEY = 'uD3EYwlXV1MraVXWCJgEsffOOBLGCjb4CAHlFUwV';

export interface AppState {
  hydrated: boolean;
  onboarded: boolean;
  profile: Profile | null;
  settings: Settings;
  diary: Diary;
  water: WaterLog;
  weights: WeightEntry[];
  meditations: MeditationSession[];
  workouts: WorkoutEntry[];
  chat: ChatMessage[];

  // steps
  steps: Record<string, number>; // daily step count by dateKey
  stepBaseline: number | null; // cumulative reading marking start of stepBaselineDay
  stepBaselineDay: string | null;

  // gamification
  xp: number;
  /** Challenge ids that already granted XP, keyed by dateKey. */
  challengeXpClaims: Record<string, string[]>;
  /** Manually completed challenge ids, keyed by dateKey. */
  manualChallenges: Record<string, string[]>;
  /** Achievement ids that already granted XP. */
  achievementClaims: string[];
  /** Running total of daily challenges ever completed. */
  challengesCompleted: number;

  // lifecycle
  setHydrated: (v: boolean) => void;
  completeOnboarding: (p: Profile) => void;
  updateProfile: (patch: Partial<Profile>) => void;

  // settings
  updateSettings: (patch: Partial<Settings>) => void;

  // diary
  addFood: (entry: Omit<FoodEntry, 'id' | 'loggedAt'>, dateKey?: string) => void;
  removeFood: (id: string, dateKey?: string) => void;
  updateFood: (id: string, patch: Partial<FoodEntry>, dateKey?: string) => void;

  // water
  addWater: (ml: number, dateKey?: string) => void;
  setWater: (ml: number, dateKey?: string) => void;

  // weight
  addWeight: (weightKg: number) => void;

  // meditation
  addMeditation: (preset: string, durationSec: number) => void;

  // workouts
  addWorkout: (type: WorkoutType, durationMin: number) => void;
  removeWorkout: (id: string) => void;

  // steps
  recordCumulativeSteps: (cumulative: number) => void;

  // gamification
  toggleManualChallenge: (dateKey: string, id: string) => void;
  claimChallengeXp: (dateKey: string, id: string, xp: number) => void;
  claimAchievement: (id: string, xp: number) => void;

  // chat
  pushChat: (msg: Omit<ChatMessage, 'id' | 'createdAt'>) => string;
  updateChat: (id: string, patch: Partial<ChatMessage>) => void;
  clearChat: () => void;

  // danger
  resetAll: () => void;
}

const defaultSettings: Settings = {
  themeMode: 'system',
  units: 'metric',
  usdaApiKey: DEFAULT_USDA_KEY,
  enableAICoach: true,
  enableAIScanner: true,
  waterCupMl: 250,
  stepGoal: 8000,
  reminderWaterEnabled: false,
  reminderWaterIntervalMin: 120,
  reminderMealsEnabled: false,
  reminderQuestEnabled: false,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      onboarded: false,
      profile: null,
      settings: defaultSettings,
      diary: {},
      water: {},
      weights: [],
      meditations: [],
      workouts: [],
      chat: [],

      steps: {},
      stepBaseline: null,
      stepBaselineDay: null,

      xp: 0,
      challengeXpClaims: {},
      manualChallenges: {},
      achievementClaims: [],
      challengesCompleted: 0,

      setHydrated: v => set({hydrated: v}),

      completeOnboarding: p =>
        set(state => ({
          onboarded: true,
          profile: p,
          weights:
            state.weights.length === 0
              ? [
                  {
                    id: uid(),
                    dateKey: todayKey(),
                    weightKg: p.weightKg,
                    loggedAt: new Date().toISOString(),
                  },
                ]
              : state.weights,
        })),

      updateProfile: patch =>
        set(state => ({
          profile: state.profile ? {...state.profile, ...patch} : state.profile,
        })),

      updateSettings: patch =>
        set(state => ({settings: {...state.settings, ...patch}})),

      addFood: (entry, dateKey = todayKey()) =>
        set(state => {
          const full: FoodEntry = {
            ...entry,
            id: uid(),
            loggedAt: new Date().toISOString(),
          };
          const day = state.diary[dateKey] ?? [];
          return {diary: {...state.diary, [dateKey]: [...day, full]}};
        }),

      removeFood: (id, dateKey = todayKey()) =>
        set(state => {
          const day = state.diary[dateKey] ?? [];
          return {
            diary: {...state.diary, [dateKey]: day.filter(e => e.id !== id)},
          };
        }),

      updateFood: (id, patch, dateKey = todayKey()) =>
        set(state => {
          const day = state.diary[dateKey] ?? [];
          return {
            diary: {
              ...state.diary,
              [dateKey]: day.map(e => (e.id === id ? {...e, ...patch} : e)),
            },
          };
        }),

      addWater: (ml, dateKey = todayKey()) =>
        set(state => ({
          water: {
            ...state.water,
            [dateKey]: Math.max(0, (state.water[dateKey] ?? 0) + ml),
          },
        })),

      setWater: (ml, dateKey = todayKey()) =>
        set(state => ({water: {...state.water, [dateKey]: Math.max(0, ml)}})),

      addWeight: weightKg =>
        set(state => {
          const entry: WeightEntry = {
            id: uid(),
            dateKey: todayKey(),
            weightKg,
            loggedAt: new Date().toISOString(),
          };
          // Replace any existing entry for today.
          const others = state.weights.filter(w => w.dateKey !== entry.dateKey);
          return {
            weights: [...others, entry].sort((a, b) =>
              a.dateKey < b.dateKey ? -1 : 1,
            ),
            profile: state.profile
              ? {...state.profile, weightKg}
              : state.profile,
          };
        }),

      addMeditation: (preset, durationSec) =>
        set(state => ({
          meditations: [
            ...state.meditations,
            {
              id: uid(),
              dateKey: todayKey(),
              preset,
              durationSec,
              loggedAt: new Date().toISOString(),
            },
          ],
        })),

      addWorkout: (type, durationMin) =>
        set(state => ({
          workouts: [
            ...state.workouts,
            {
              id: uid(),
              dateKey: todayKey(),
              type,
              durationMin,
              loggedAt: new Date().toISOString(),
            },
          ],
        })),

      removeWorkout: id =>
        set(state => ({workouts: state.workouts.filter(w => w.id !== id)})),

      recordCumulativeSteps: cumulative =>
        set(state => {
          const today = todayKey();
          let baseline = state.stepBaseline;
          let baselineDay = state.stepBaselineDay;
          // New day, first sample, or a reboot (counter reset) -> rebaseline.
          if (baselineDay !== today || baseline == null || cumulative < baseline) {
            baseline = cumulative;
            baselineDay = today;
          }
          const daily = Math.max(0, Math.round(cumulative - baseline));
          return {
            stepBaseline: baseline,
            stepBaselineDay: baselineDay,
            steps: {...state.steps, [today]: daily},
          };
        }),

      toggleManualChallenge: (dateKey, id) =>
        set(state => {
          const day = state.manualChallenges[dateKey] ?? [];
          const next = day.includes(id)
            ? day.filter(x => x !== id)
            : [...day, id];
          return {manualChallenges: {...state.manualChallenges, [dateKey]: next}};
        }),

      claimChallengeXp: (dateKey, id, xp) =>
        set(state => {
          const claimed = state.challengeXpClaims[dateKey] ?? [];
          if (claimed.includes(id)) return state;
          return {
            xp: state.xp + xp,
            challengesCompleted: state.challengesCompleted + 1,
            challengeXpClaims: {
              ...state.challengeXpClaims,
              [dateKey]: [...claimed, id],
            },
          };
        }),

      claimAchievement: (id, xp) =>
        set(state => {
          if (state.achievementClaims.includes(id)) return state;
          return {
            xp: state.xp + xp,
            achievementClaims: [...state.achievementClaims, id],
          };
        }),

      pushChat: msg => {
        const id = uid();
        set(state => ({
          chat: [
            ...state.chat,
            {...msg, id, createdAt: new Date().toISOString()},
          ],
        }));
        return id;
      },

      updateChat: (id, patch) =>
        set(state => ({
          chat: state.chat.map(m => (m.id === id ? {...m, ...patch} : m)),
        })),

      clearChat: () => set({chat: []}),

      resetAll: () =>
        set({
          onboarded: false,
          profile: null,
          settings: defaultSettings,
          diary: {},
          water: {},
          weights: [],
          meditations: [],
          workouts: [],
          chat: [],
          steps: {},
          stepBaseline: null,
          stepBaselineDay: null,
          xp: 0,
          challengeXpClaims: {},
          manualChallenges: {},
          achievementClaims: [],
          challengesCompleted: 0,
        }),
    }),
    {
      name: 'nutrilife-store-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        onboarded: state.onboarded,
        profile: state.profile,
        settings: state.settings,
        diary: state.diary,
        water: state.water,
        weights: state.weights,
        meditations: state.meditations,
        workouts: state.workouts,
        chat: state.chat,
        steps: state.steps,
        stepBaseline: state.stepBaseline,
        stepBaselineDay: state.stepBaselineDay,
        xp: state.xp,
        challengeXpClaims: state.challengeXpClaims,
        manualChallenges: state.manualChallenges,
        achievementClaims: state.achievementClaims,
        challengesCompleted: state.challengesCompleted,
      }),
      onRehydrateStorage: () => state => {
        state?.setHydrated(true);
      },
    },
  ),
);
