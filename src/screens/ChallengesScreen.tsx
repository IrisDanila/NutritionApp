import React, {useState} from 'react';
import {View, Pressable} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import IconButton from '../components/IconButton';
import Input from '../components/Input';
import Button from '../components/Button';
import Chip from '../components/Chip';
import LevelCard from '../components/LevelCard';
import ChallengeCard from '../components/ChallengeCard';
import {useTheme} from '../theme/ThemeContext';
import {radius, spacing} from '../theme/typography';
import {useGamification} from '../hooks/useGamification';
import {useAppStore} from '../store/useAppStore';
import {RootStackParamList} from '../navigation/types';
import {WorkoutType} from '../store/types';
import {todayKey} from '../utils/date';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const WORKOUTS: {type: WorkoutType; label: string; icon: string}[] = [
  {type: 'gym', label: 'Gym', icon: 'dumbbell'},
  {type: 'run', label: 'Run', icon: 'run'},
  {type: 'cycle', label: 'Cycle', icon: 'bike'},
  {type: 'yoga', label: 'Yoga', icon: 'yoga'},
  {type: 'swim', label: 'Swim', icon: 'swim'},
  {type: 'walk', label: 'Walk', icon: 'walk'},
  {type: 'sport', label: 'Sport', icon: 'basketball'},
  {type: 'other', label: 'Other', icon: 'heart-pulse'},
];

export const ChallengesScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation<Nav>();
  const {level, challenges, completedToday, toggleManual} = useGamification();

  const workouts = useAppStore(s => s.workouts);
  const addWorkout = useAppStore(s => s.addWorkout);
  const removeWorkout = useAppStore(s => s.removeWorkout);

  const [wType, setWType] = useState<WorkoutType>('gym');
  const [wDur, setWDur] = useState('45');

  const today = todayKey();
  const todayWorkouts = workouts.filter(w => w.dateKey === today);
  const allDone = completedToday >= challenges.length && challenges.length > 0;

  const logWorkout = () => {
    const d = parseInt(wDur, 10);
    if (!isNaN(d) && d > 0) addWorkout(wType, Math.min(600, d));
  };

  return (
    <Screen scroll>
      <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg}}>
        <IconButton name="arrow-left" onPress={() => navigation.goBack()} />
        <Txt variant="h1" style={{marginLeft: spacing.sm, flex: 1}}>
          Quests
        </Txt>
        <IconButton name="trophy" tinted onPress={() => navigation.navigate('Achievements')} />
      </View>

      <LevelCard level={level} onPress={() => navigation.navigate('Achievements')} />

      {/* Daily challenges */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: spacing.xl,
          marginBottom: spacing.md,
        }}>
        <Txt variant="h2">Today's Challenges</Txt>
        <View
          style={{
            backgroundColor: allDone ? theme.success : theme.bgSunken,
            paddingHorizontal: spacing.md,
            paddingVertical: 4,
            borderRadius: radius.pill,
          }}>
          <Txt variant="label" color={allDone ? '#fff' : theme.textMuted}>
            {completedToday}/{challenges.length}
          </Txt>
        </View>
      </View>

      {allDone ? (
        <Card flat style={{backgroundColor: theme.primarySoft, borderColor: 'transparent', marginBottom: spacing.md}}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Icon name="party-popper" size={24} color={theme.primary} />
            <Txt style={{marginLeft: spacing.md, flex: 1}}>
              All challenges done — amazing! New quests arrive tomorrow.
            </Txt>
          </View>
        </Card>
      ) : null}

      {challenges.map(item => (
        <ChallengeCard
          key={item.challenge.id}
          item={item}
          onToggle={() => toggleManual(item.challenge.id)}
        />
      ))}

      <Txt variant="caption" tone="faint" center style={{marginTop: spacing.xs}}>
        Challenges refresh every day at midnight. Auto challenges tick off from
        your tracked data; tap "Done" for the rest.
      </Txt>

      {/* Workout log */}
      <Txt variant="h2" style={{marginTop: spacing.xl, marginBottom: spacing.md}}>
        Log a Workout
      </Txt>
      <Card>
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm}}>
          {WORKOUTS.map(w => (
            <Chip
              key={w.type}
              icon={w.icon}
              label={w.label}
              color={theme.accent}
              selected={wType === w.type}
              onPress={() => setWType(w.type)}
            />
          ))}
        </View>
        <View style={{flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md, marginTop: spacing.lg}}>
          <Input
            label="Duration"
            keyboardType="number-pad"
            value={wDur}
            onChangeText={setWDur}
            suffix="min"
            containerStyle={{flex: 1}}
          />
          <Button title="Log" icon="plus" onPress={logWorkout} />
        </View>
      </Card>

      {todayWorkouts.length > 0 ? (
        <Card padded={false} style={{paddingHorizontal: spacing.lg, marginTop: spacing.md}}>
          {todayWorkouts.map((w, i) => {
            const meta = WORKOUTS.find(x => x.type === w.type)!;
            return (
              <View
                key={w.id}
                style={[
                  {flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md},
                  i < todayWorkouts.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border,
                  },
                ]}>
                <Icon name={meta.icon} size={20} color={theme.accent} />
                <Txt style={{flex: 1, marginLeft: spacing.md}}>{meta.label}</Txt>
                <Txt tone="muted">{w.durationMin} min</Txt>
                <Pressable onPress={() => removeWorkout(w.id)} hitSlop={10} style={{marginLeft: spacing.md}}>
                  <Icon name="close-circle" size={20} color={theme.textFaint} />
                </Pressable>
              </View>
            );
          })}
        </Card>
      ) : null}

      <Button
        title="View all achievements"
        icon="trophy-variant"
        variant="secondary"
        full
        onPress={() => navigation.navigate('Achievements')}
        style={{marginTop: spacing.xl}}
      />
    </Screen>
  );
};

export default ChallengesScreen;
