import React, {useState, useMemo} from 'react';
import {View, ScrollView} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../theme/ThemeContext';
import {spacing} from '../theme/typography';
import {useAppStore} from '../store/useAppStore';
import {
  ActivityLevel,
  GoalType,
  Profile,
  Sex,
} from '../store/types';
import {
  ACTIVITY_LABELS,
  GOAL_LABELS,
  computeTargets,
} from '../services/nutrition';
import Txt from '../components/Txt';
import Input from '../components/Input';
import Button from '../components/Button';
import SegmentedControl from '../components/SegmentedControl';
import Chip from '../components/Chip';
import Card from '../components/Card';
import Icon from '../components/Icon';

export const OnboardingScreen: React.FC = () => {
  const {theme} = useTheme();
  const completeOnboarding = useAppStore(s => s.completeOnboarding);

  const [name, setName] = useState('');
  const [sex, setSex] = useState<Sex>('male');
  const [age, setAge] = useState('25');
  const [height, setHeight] = useState('175');
  const [weight, setWeight] = useState('70');
  const [activity, setActivity] = useState<ActivityLevel>('moderate');
  const [goal, setGoal] = useState<GoalType>('maintain');

  const draft: Profile = {
    name: name.trim(),
    sex,
    age: clampNum(age, 14, 100, 25),
    heightCm: clampNum(height, 120, 230, 175),
    weightKg: clampNum(weight, 35, 250, 70),
    activity,
    goal,
  };

  const targets = useMemo(() => computeTargets(draft), [
    sex,
    age,
    height,
    weight,
    activity,
    goal,
  ]);

  const valid = name.trim().length > 0;

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: theme.bg}} edges={['top']}>
      <ScrollView
        contentContainerStyle={{padding: spacing.lg, paddingBottom: spacing.xxxl}}
        showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={theme.gradientPrimary}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={{
            borderRadius: 24,
            padding: spacing.xl,
            marginBottom: spacing.xl,
          }}>
          <Icon name="leaf" size={34} color={theme.textOnPrimary} />
          <Txt variant="displayLg" color={theme.textOnPrimary} style={{marginTop: spacing.md}}>
            NutriLife
          </Txt>
          <Txt color={theme.textOnPrimary} style={{opacity: 0.9, marginTop: 4}}>
            Your private, on-device nutrition & wellness coach. Let's set up your
            plan.
          </Txt>
        </LinearGradient>

        <Input
          label="What should we call you?"
          placeholder="Your name"
          value={name}
          onChangeText={setName}
          containerStyle={{marginBottom: spacing.lg}}
        />

        <Txt variant="label" tone="muted" style={{marginBottom: spacing.xs}}>
          Sex (for metabolic estimate)
        </Txt>
        <SegmentedControl
          value={sex}
          onChange={setSex}
          options={[
            {value: 'male', label: 'Male'},
            {value: 'female', label: 'Female'},
          ]}
        />

        <View style={{flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg}}>
          <Input
            label="Age"
            keyboardType="number-pad"
            value={age}
            onChangeText={setAge}
            suffix="yrs"
            containerStyle={{flex: 1}}
          />
          <Input
            label="Height"
            keyboardType="number-pad"
            value={height}
            onChangeText={setHeight}
            suffix="cm"
            containerStyle={{flex: 1}}
          />
          <Input
            label="Weight"
            keyboardType="number-pad"
            value={weight}
            onChangeText={setWeight}
            suffix="kg"
            containerStyle={{flex: 1}}
          />
        </View>

        <Txt variant="label" tone="muted" style={{marginTop: spacing.lg, marginBottom: spacing.sm}}>
          Activity level
        </Txt>
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm}}>
          {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map(a => (
            <Chip
              key={a}
              label={ACTIVITY_LABELS[a].split(' (')[0]}
              selected={activity === a}
              onPress={() => setActivity(a)}
            />
          ))}
        </View>

        <Txt variant="label" tone="muted" style={{marginTop: spacing.lg, marginBottom: spacing.xs}}>
          Your goal
        </Txt>
        <SegmentedControl
          value={goal}
          onChange={setGoal}
          options={(Object.keys(GOAL_LABELS) as GoalType[]).map(g => ({
            value: g,
            label: GOAL_LABELS[g],
          }))}
        />

        <Card style={{marginTop: spacing.xl}}>
          <Txt variant="label" tone="muted">
            YOUR DAILY PLAN
          </Txt>
          <View style={{flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing.sm}}>
            <Txt variant="displayLg" tone="primary">
              {targets.calories}
            </Txt>
            <Txt variant="h3" tone="muted" style={{marginBottom: 6, marginLeft: 6}}>
              kcal/day
            </Txt>
          </View>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm}}>
            <Txt tone="muted">Protein {targets.protein}g</Txt>
            <Txt tone="muted">Carbs {targets.carbs}g</Txt>
            <Txt tone="muted">Fat {targets.fat}g</Txt>
          </View>
          <Txt tone="faint" variant="caption" style={{marginTop: spacing.sm}}>
            Water goal {Math.round(targets.waterMl / 1000 * 10) / 10} L · You can
            change everything later in Settings.
          </Txt>
        </Card>

        <Button
          title="Start my journey"
          icon="arrow-right"
          onPress={() => completeOnboarding(draft)}
          disabled={!valid}
          full
          style={{marginTop: spacing.xl}}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

function clampNum(s: string, min: number, max: number, fallback: number) {
  const n = parseFloat(s);
  if (isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

export default OnboardingScreen;
