import React, {useMemo} from 'react';
import {View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import IconButton from '../components/IconButton';
import LevelCard from '../components/LevelCard';
import {useTheme} from '../theme/ThemeContext';
import {radius, spacing} from '../theme/typography';
import {useGamification} from '../hooks/useGamification';
import {Achievement, AchievementCategory} from '../services/achievements';

const CATEGORY_LABELS: Record<AchievementCategory, {label: string; icon: string; color: string}> = {
  consistency: {label: 'Consistency', icon: 'calendar-check', color: '#16A571'},
  hydration: {label: 'Hydration', icon: 'cup-water', color: '#3AB7E8'},
  nutrition: {label: 'Nutrition', icon: 'food-apple', color: '#F4A92C'},
  fitness: {label: 'Fitness', icon: 'dumbbell', color: '#FF7A59'},
  mind: {label: 'Mind', icon: 'meditation', color: '#9C5BFF'},
  progression: {label: 'Progression', icon: 'trending-up', color: '#3D7BFF'},
};

const ORDER: AchievementCategory[] = [
  'consistency', 'fitness', 'nutrition', 'hydration', 'mind', 'progression',
];

export const AchievementsScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation();
  const {level, achievements} = useGamification();

  const unlocked = achievements.filter(a => a.unlocked).length;
  const grouped = useMemo(() => {
    const map = {} as Record<AchievementCategory, Achievement[]>;
    ORDER.forEach(c => (map[c] = []));
    achievements.forEach(a => map[a.category].push(a));
    return map;
  }, [achievements]);

  return (
    <Screen scroll>
      <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg}}>
        <IconButton name="arrow-left" onPress={() => navigation.goBack()} />
        <Txt variant="h1" style={{marginLeft: spacing.sm, flex: 1}}>
          Achievements
        </Txt>
        <View
          style={{
            backgroundColor: theme.primarySoft,
            paddingHorizontal: spacing.md,
            paddingVertical: 4,
            borderRadius: radius.pill,
          }}>
          <Txt variant="label" tone="primary">
            {unlocked}/{achievements.length}
          </Txt>
        </View>
      </View>

      <LevelCard level={level} />

      {ORDER.map(cat => {
        const items = grouped[cat];
        if (!items?.length) return null;
        const meta = CATEGORY_LABELS[cat];
        const done = items.filter(i => i.unlocked).length;
        return (
          <View key={cat} style={{marginTop: spacing.xl}}>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md}}>
              <Icon name={meta.icon} size={20} color={meta.color} />
              <Txt variant="h3" style={{marginLeft: spacing.sm, flex: 1}}>
                {meta.label}
              </Txt>
              <Txt variant="caption" tone="muted">
                {done}/{items.length}
              </Txt>
            </View>

            {items.map(ach => (
              <AchievementRow key={ach.id} ach={ach} accent={meta.color} />
            ))}
          </View>
        );
      })}

      <Txt variant="caption" tone="faint" center style={{marginTop: spacing.xl}}>
        Unlocking an achievement grants bonus XP toward your level.
      </Txt>
    </Screen>
  );
};

const AchievementRow: React.FC<{ach: Achievement; accent: string}> = ({ach, accent}) => {
  const {theme} = useTheme();
  const progress = Math.min(1, ach.current / ach.target);
  return (
    <Card
      padded={false}
      style={{
        marginBottom: spacing.sm,
        opacity: ach.unlocked ? 1 : 0.92,
        borderColor: ach.unlocked ? accent : theme.border,
        borderWidth: ach.unlocked ? 1.5 : 1,
      }}>
      <View style={{flexDirection: 'row', alignItems: 'center', padding: spacing.lg}}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: ach.unlocked ? accent : theme.bgSunken,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Icon name={ach.unlocked ? ach.icon : 'lock'} size={24} color={ach.unlocked ? '#fff' : theme.textFaint} />
        </View>
        <View style={{flex: 1, marginLeft: spacing.md}}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Txt variant="h3" style={{flex: 1}} numberOfLines={1}>
              {ach.title}
            </Txt>
            <Txt variant="caption" tone={ach.unlocked ? 'primary' : 'faint'}>
              +{ach.xp} XP
            </Txt>
          </View>
          <Txt variant="caption" tone="muted">
            {ach.description}
          </Txt>
          {ach.unlocked ? (
            <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 6}}>
              <Icon name="check-circle" size={14} color={accent} />
              <Txt variant="caption" color={accent} style={{marginLeft: 4}}>
                Unlocked
              </Txt>
            </View>
          ) : (
            <View style={{marginTop: 8}}>
              <View
                style={{
                  height: 6,
                  borderRadius: radius.pill,
                  backgroundColor: theme.bgSunken,
                  overflow: 'hidden',
                }}>
                <View style={{width: `${progress * 100}%`, height: '100%', backgroundColor: accent}} />
              </View>
              <Txt variant="caption" tone="faint" style={{marginTop: 4}}>
                {ach.current} / {ach.target}
              </Txt>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
};

export default AchievementsScreen;
