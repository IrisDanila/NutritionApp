import React from 'react';
import {View, Pressable} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import IconButton from '../components/IconButton';
import ProgressRing from '../components/ProgressRing';
import {MacroRow} from '../components/MacroBar';
import {useTheme} from '../theme/ThemeContext';
import {radius, spacing} from '../theme/typography';
import {RootStackParamList} from '../navigation/types';
import {useAppStore} from '../store/useAppStore';
import {
  useDayEntries,
  useDayTotals,
  useStreak,
  useTargets,
  useWaterToday,
} from '../hooks/useNutrition';
import {todayKey, timeOfDayGreeting} from '../utils/date';
import {round} from '../utils/math';
import FoodRow from '../components/FoodRow';
import LevelBadge from '../components/LevelBadge';
import {useGamification} from '../hooks/useGamification';
import {useSteps} from '../hooks/useSteps';
import {DAILY_TIPS} from '../services/tips';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const QUICK_ACTIONS: {
  icon: string;
  label: string;
  to: keyof RootStackParamList | 'ScanTab' | 'CoachTab';
  tint: (t: any) => string;
}[] = [
  {icon: 'camera-iris', label: 'Scan', to: 'ScanTab', tint: t => t.primary},
  {icon: 'magnify', label: 'Search', to: 'FoodSearch', tint: t => t.protein},
  {icon: 'cup-water', label: 'Water', to: 'Water', tint: t => t.water},
  {icon: 'meditation', label: 'Meditate', to: 'Meditation', tint: t => t.gradientCalm[0]},
];

export const DashboardScreen: React.FC = () => {
  const {theme, isDark, toggle} = useTheme();
  const navigation = useNavigation<Nav>();
  const profile = useAppStore(s => s.profile);
  const targets = useTargets();
  const today = todayKey();
  const totals = useDayTotals(today);
  const water = useWaterToday(today);
  const streak = useStreak();
  const entries = useDayEntries(today);
  const addWater = useAppStore(s => s.addWater);
  const cup = useAppStore(s => s.settings.waterCupMl);
  const {level, challenges, completedToday} = useGamification();
  const nextQuest = challenges.find(c => !c.complete)?.challenge;
  const stepState = useSteps();

  const calTarget = targets?.calories ?? 2000;
  const remaining = Math.max(0, calTarget - totals.calories);
  const progress = totals.calories / calTarget;
  const tip = DAILY_TIPS[new Date().getDate() % DAILY_TIPS.length];

  // Within a tab screen, `navigate` switches sibling tabs and bubbles up to the
  // root stack for stack-only routes (Water, FoodSearch, Meditation, …).
  const goTo = (to: string) => {
    if (to === 'ScanTab') navigation.navigate('Scan' as never);
    else if (to === 'CoachTab') navigation.navigate('Coach' as never);
    else navigation.navigate(to as never);
  };

  const waterPct = targets ? Math.min(1, water / targets.waterMl) : 0;

  return (
    <Screen scroll>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.lg,
        }}>
        <View>
          <Txt variant="label" tone="muted">
            {timeOfDayGreeting()}
          </Txt>
          <Txt variant="h1">{profile?.name || 'Friend'} 👋</Txt>
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.accentSoft,
              paddingHorizontal: spacing.md,
              paddingVertical: 6,
              borderRadius: radius.pill,
              marginRight: spacing.sm,
            }}>
            <Icon name="fire" size={16} color={theme.accent} />
            <Txt variant="label" color={theme.accent} style={{marginLeft: 4}}>
              {streak}
            </Txt>
          </View>
          <IconButton
            name={isDark ? 'weather-sunny' : 'weather-night'}
            tinted
            onPress={toggle}
          />
        </View>
      </View>

      {/* Calorie ring card */}
      <Card>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <ProgressRing
            size={150}
            progress={progress}
            color={progress > 1 ? theme.warning : theme.primary}>
            <Txt variant="display">{round(remaining)}</Txt>
            <Txt variant="caption" tone="muted">
              kcal left
            </Txt>
          </ProgressRing>
          <View style={{flex: 1, marginLeft: spacing.lg}}>
            <Row label="Goal" value={`${calTarget} kcal`} />
            <Row label="Food" value={`${round(totals.calories)} kcal`} />
            <Row
              label="Remaining"
              value={`${remaining} kcal`}
              highlight={theme.primary}
            />
          </View>
        </View>
        <View style={{height: 1, backgroundColor: theme.border, marginVertical: spacing.lg}} />
        {targets ? (
          <MacroRow
            carbs={{value: totals.carbs, target: targets.carbs}}
            protein={{value: totals.protein, target: targets.protein}}
            fat={{value: totals.fat, target: targets.fat}}
          />
        ) : null}
      </Card>

      {/* Quick actions */}
      <View
        style={{
          flexDirection: 'row',
          gap: spacing.md,
          marginTop: spacing.lg,
        }}>
        {QUICK_ACTIONS.map(a => (
          <Pressable
            key={a.label}
            onPress={() => goTo(a.to)}
            style={({pressed}) => ({
              flex: 1,
              opacity: pressed ? 0.7 : 1,
            })}>
            <Card padded={false} style={{padding: spacing.md, alignItems: 'center'}}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: radius.md,
                  backgroundColor: a.tint(theme) + '22',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: spacing.sm,
                }}>
                <Icon name={a.icon} size={22} color={a.tint(theme)} />
              </View>
              <Txt variant="caption" center numberOfLines={1}>
                {a.label}
              </Txt>
            </Card>
          </Pressable>
        ))}
      </View>

      {/* Quests / level */}
      <Card style={{marginTop: spacing.lg}} onPress={() => navigation.navigate('Challenges')}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <LevelBadge level={level.level} color={level.rank.color} size={52} />
          <View style={{flex: 1, marginLeft: spacing.md}}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Txt variant="h3">Daily Quests</Txt>
              <View
                style={{
                  marginLeft: spacing.sm,
                  backgroundColor:
                    completedToday >= challenges.length ? theme.success : theme.bgSunken,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: 2,
                  borderRadius: radius.pill,
                }}>
                <Txt
                  variant="caption"
                  color={completedToday >= challenges.length ? '#fff' : theme.textMuted}>
                  {completedToday}/{challenges.length}
                </Txt>
              </View>
            </View>
            <Txt variant="caption" tone="muted" numberOfLines={1}>
              {nextQuest ? `Next: ${nextQuest.title}` : 'All done today — nice work! 🎉'}
            </Txt>
            <View
              style={{
                height: 6,
                borderRadius: radius.pill,
                backgroundColor: theme.bgSunken,
                marginTop: 8,
                overflow: 'hidden',
              }}>
              <View
                style={{
                  width: `${level.progress * 100}%`,
                  height: '100%',
                  backgroundColor: level.rank.color,
                }}
              />
            </View>
          </View>
          <Icon name="chevron-right" size={22} color={theme.textFaint} />
        </View>
      </Card>

      {/* Water card */}
      <Card style={{marginTop: spacing.lg}} onPress={() => navigation.navigate('Water')}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <Icon name="cup-water" size={26} color={theme.water} />
          <View style={{flex: 1, marginLeft: spacing.md}}>
            <Txt variant="h3">Hydration</Txt>
            <Txt variant="caption" tone="muted">
              {(water / 1000).toFixed(2)} L
              {targets ? ` of ${(targets.waterMl / 1000).toFixed(1)} L` : ''}
            </Txt>
          </View>
          <Pressable
            onPress={() => addWater(cup)}
            hitSlop={8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.water + '22',
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: radius.pill,
            }}>
            <Icon name="plus" size={16} color={theme.water} />
            <Txt variant="label" color={theme.water} style={{marginLeft: 4}}>
              {cup}ml
            </Txt>
          </Pressable>
        </View>
        <View
          style={{
            height: 8,
            borderRadius: radius.pill,
            backgroundColor: theme.bgSunken,
            marginTop: spacing.md,
            overflow: 'hidden',
          }}>
          <View
            style={{
              width: `${waterPct * 100}%`,
              height: '100%',
              backgroundColor: theme.water,
            }}
          />
        </View>
      </Card>

      {/* Steps */}
      <Card style={{marginTop: spacing.lg}}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <Icon name="shoe-print" size={26} color={theme.accent} />
          <View style={{flex: 1, marginLeft: spacing.md}}>
            <Txt variant="h3">Steps</Txt>
            <Txt variant="caption" tone="muted">
              {stepState.available === false
                ? 'Step sensor unavailable on this device'
                : `${stepState.steps.toLocaleString()} of ${stepState.goal.toLocaleString()}`}
            </Txt>
          </View>
          {stepState.available !== false ? (
            <Txt variant="h2" color={theme.accent}>
              {Math.round(stepState.progress * 100)}%
            </Txt>
          ) : null}
        </View>
        {stepState.available !== false ? (
          <View
            style={{
              height: 8,
              borderRadius: radius.pill,
              backgroundColor: theme.bgSunken,
              marginTop: spacing.md,
              overflow: 'hidden',
            }}>
            <View
              style={{
                width: `${stepState.progress * 100}%`,
                height: '100%',
                backgroundColor: theme.accent,
              }}
            />
          </View>
        ) : null}
      </Card>

      {/* Tip */}
      <Card
        flat
        style={{marginTop: spacing.lg, backgroundColor: theme.primarySoft, borderColor: 'transparent'}}
        onPress={() => navigation.navigate('Coach' as never)}>
        <View style={{flexDirection: 'row'}}>
          <Icon name="lightbulb-on" size={22} color={theme.primary} />
          <View style={{flex: 1, marginLeft: spacing.md}}>
            <Txt variant="label" tone="primary">
              TIP OF THE DAY
            </Txt>
            <Txt style={{marginTop: 4}}>{tip}</Txt>
          </View>
        </View>
      </Card>

      {/* Today's meals preview */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: spacing.xl,
          marginBottom: spacing.sm,
        }}>
        <Txt variant="h2">Today's food</Txt>
        <Pressable onPress={() => navigation.navigate('Diary' as never)} hitSlop={8}>
          <Txt variant="label" tone="primary">
            See all
          </Txt>
        </Pressable>
      </View>
      {entries.length === 0 ? (
        <Card>
          <Txt tone="muted" center>
            Nothing logged yet. Tap Scan or Search to add your first meal.
          </Txt>
        </Card>
      ) : (
        <Card padded={false} style={{paddingHorizontal: spacing.lg}}>
          {entries.slice(-4).reverse().map((e, i, arr) => (
            <View
              key={e.id}
              style={
                i < arr.length - 1
                  ? {borderBottomWidth: 1, borderBottomColor: theme.border}
                  : undefined
              }>
              <FoodRow entry={e} />
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
};

const Row: React.FC<{label: string; value: string; highlight?: string}> = ({
  label,
  value,
  highlight,
}) => (
  <View
    style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    }}>
    <Txt tone="muted">{label}</Txt>
    <Txt variant="h3" color={highlight}>
      {value}
    </Txt>
  </View>
);

export default DashboardScreen;
