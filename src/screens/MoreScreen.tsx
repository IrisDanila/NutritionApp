import React from 'react';
import {View, Pressable} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import {useTheme} from '../theme/ThemeContext';
import {radius, spacing} from '../theme/typography';
import {RootStackParamList} from '../navigation/types';
import {useAppStore} from '../store/useAppStore';
import {useTargets} from '../hooks/useNutrition';
import {useGamification} from '../hooks/useGamification';
import LevelCard from '../components/LevelCard';
import {GOAL_LABELS, bmi} from '../services/nutrition';
import {round} from '../utils/math';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const MENU: {
  icon: string;
  label: string;
  to: keyof RootStackParamList;
  tint: (t: any) => string;
  sub: string;
}[] = [
  {icon: 'sword-cross', label: 'Quests & Level', to: 'Challenges', tint: t => t.primary, sub: 'Daily challenges & XP'},
  {icon: 'silverware-fork-knife', label: 'Recipes', to: 'Recipes', tint: t => t.accent, sub: 'Discover & cook meals'},
  {icon: 'calendar-month', label: 'Goal Calendar', to: 'GoalCalendar', tint: t => t.primary, sub: 'Days you hit your goal'},
  {icon: 'cup-water', label: 'Hydration', to: 'Water', tint: t => t.water, sub: 'Track your water intake'},
  {icon: 'meditation', label: 'Meditation', to: 'Meditation', tint: t => t.gradientCalm[0], sub: 'Breathe & relax'},
  {icon: 'scale-bathroom', label: 'Weight', to: 'Weight', tint: t => t.protein, sub: 'Log weight & BMI'},
  {icon: 'chart-line', label: 'History', to: 'History', tint: t => t.accent, sub: 'Trends & insights'},
  {icon: 'trophy', label: 'Achievements', to: 'Achievements', tint: t => t.carbs, sub: 'Your milestones'},
  {icon: 'cog', label: 'Settings', to: 'Settings', tint: t => t.textMuted, sub: 'Theme, profile, API key'},
];

export const MoreScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation<Nav>();
  const profile = useAppStore(s => s.profile);
  const targets = useTargets();
  const {level} = useGamification();

  return (
    <Screen scroll>
      <Txt variant="h1" style={{marginBottom: spacing.lg}}>
        More
      </Txt>

      <LinearGradient
        colors={theme.gradientPrimary}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={{borderRadius: radius.lg, padding: spacing.xl}}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: 'rgba(255,255,255,0.25)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Txt variant="h1" color="#fff">
              {(profile?.name || 'N')[0].toUpperCase()}
            </Txt>
          </View>
          <View style={{marginLeft: spacing.md, flex: 1}}>
            <Txt variant="h2" color="#fff">
              {profile?.name || 'NutriLife user'}
            </Txt>
            <Txt color="#fff" style={{opacity: 0.9}}>
              {profile ? GOAL_LABELS[profile.goal] : ''}
              {targets ? ` · ${targets.calories} kcal/day` : ''}
            </Txt>
          </View>
        </View>
        {profile ? (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: spacing.lg,
            }}>
            <Stat label="Weight" value={`${round(profile.weightKg, 1)} kg`} />
            <Stat label="Height" value={`${profile.heightCm} cm`} />
            <Stat label="BMI" value={`${round(bmi(profile), 1)}`} />
          </View>
        ) : null}
      </LinearGradient>

      <View style={{marginTop: spacing.lg}}>
        <LevelCard level={level} onPress={() => navigation.navigate('Challenges')} />
      </View>

      <View style={{marginTop: spacing.xl}}>
        {MENU.map(m => (
          <Pressable
            key={m.to}
            onPress={() => navigation.navigate(m.to as never)}
            style={({pressed}) => ({opacity: pressed ? 0.7 : 1})}>
            <Card padded={false} style={{marginBottom: spacing.sm}}>
              <View style={{flexDirection: 'row', alignItems: 'center', padding: spacing.lg}}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: radius.md,
                    backgroundColor: m.tint(theme) + '22',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Icon name={m.icon} size={22} color={m.tint(theme)} />
                </View>
                <View style={{flex: 1, marginLeft: spacing.md}}>
                  <Txt variant="h3">{m.label}</Txt>
                  <Txt variant="caption" tone="muted">
                    {m.sub}
                  </Txt>
                </View>
                <Icon name="chevron-right" size={22} color={theme.textFaint} />
              </View>
            </Card>
          </Pressable>
        ))}
      </View>

      <Txt variant="caption" tone="faint" center style={{marginTop: spacing.lg}}>
        NutriLife 2.0 · On-device AI · Data stays on your phone
      </Txt>
    </Screen>
  );
};

const Stat: React.FC<{label: string; value: string}> = ({label, value}) => (
  <View>
    <Txt variant="caption" color="#fff" style={{opacity: 0.8}}>
      {label}
    </Txt>
    <Txt variant="h3" color="#fff">
      {value}
    </Txt>
  </View>
);

export default MoreScreen;
