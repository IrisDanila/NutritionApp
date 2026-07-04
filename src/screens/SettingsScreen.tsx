import React, {useState} from 'react';
import {View, Switch, Alert, Pressable} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import IconButton from '../components/IconButton';
import Input from '../components/Input';
import Chip from '../components/Chip';
import Button from '../components/Button';
import SegmentedControl from '../components/SegmentedControl';
import {useTheme} from '../theme/ThemeContext';
import {spacing} from '../theme/typography';
import {useAppStore} from '../store/useAppStore';
import {
  ACTIVITY_LABELS,
  GOAL_LABELS,
} from '../services/nutrition';
import {syncReminders} from '../services/notifications';
import {ActivityLevel, GoalType, Settings, ThemeMode} from '../store/types';

const Section: React.FC<{title: string; children: React.ReactNode}> = ({
  title,
  children,
}) => (
  <View style={{marginTop: spacing.xl}}>
    <Txt variant="label" tone="muted" style={{marginBottom: spacing.sm, marginLeft: 4}}>
      {title.toUpperCase()}
    </Txt>
    <Card>{children}</Card>
  </View>
);

const RowItem: React.FC<{
  icon: string;
  label: string;
  right: React.ReactNode;
  last?: boolean;
}> = ({icon, label, right, last}) => {
  const {theme} = useTheme();
  return (
    <View
      style={[
        {flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md},
        !last && {borderBottomWidth: 1, borderBottomColor: theme.border},
      ]}>
      <Icon name={icon} size={20} color={theme.textMuted} />
      <Txt style={{flex: 1, marginLeft: spacing.md}}>{label}</Txt>
      {right}
    </View>
  );
};

export const SettingsScreen: React.FC = () => {
  const {theme, mode, setMode} = useTheme();
  const navigation = useNavigation();
  const settings = useAppStore(s => s.settings);
  const updateSettings = useAppStore(s => s.updateSettings);
  const profile = useAppStore(s => s.profile);
  const updateProfile = useAppStore(s => s.updateProfile);
  const resetAll = useAppStore(s => s.resetAll);

  const [name, setName] = useState(profile?.name ?? '');
  const [age, setAge] = useState(`${profile?.age ?? ''}`);
  const [height, setHeight] = useState(`${profile?.heightCm ?? ''}`);
  const [weight, setWeight] = useState(`${profile?.weightKg ?? ''}`);
  const [override, setOverride] = useState(
    profile?.calorieTargetOverride ? `${profile.calorieTargetOverride}` : '',
  );
  const [apiKey, setApiKey] = useState(settings.usdaApiKey);
  const [cup, setCup] = useState(`${settings.waterCupMl}`);
  const [stepGoal, setStepGoal] = useState(`${settings.stepGoal}`);
  const [waterInterval, setWaterInterval] = useState(`${settings.reminderWaterIntervalMin}`);

  // Toggle a reminder setting and immediately (re)schedule the alarms.
  const toggleReminder = (patch: Partial<Settings>) => {
    const next = {...settings, ...patch};
    updateSettings(patch);
    syncReminders(next);
  };

  const saveProfile = () => {
    updateProfile({
      name: name.trim() || profile?.name || 'Friend',
      age: clampNum(age, 14, 100, profile?.age ?? 25),
      heightCm: clampNum(height, 120, 230, profile?.heightCm ?? 175),
      weightKg: clampNum(weight, 35, 250, profile?.weightKg ?? 70),
      calorieTargetOverride: override ? clampNum(override, 1000, 5000, 2000) : null,
    });
    const patch: Partial<Settings> = {
      usdaApiKey: apiKey.trim(),
      waterCupMl: clampNum(cup, 50, 1000, 250),
      stepGoal: clampNum(stepGoal, 1000, 50000, 8000),
      reminderWaterIntervalMin: clampNum(waterInterval, 30, 480, 120),
    };
    updateSettings(patch);
    syncReminders({...settings, ...patch});
    Alert.alert('Saved', 'Your settings have been updated.');
  };

  const confirmReset = () => {
    Alert.alert(
      'Reset everything?',
      'This permanently deletes your profile, diary, water, weight and chat history on this device.',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Reset', style: 'destructive', onPress: resetAll},
      ],
    );
  };

  return (
    <Screen scroll>
      <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm}}>
        <IconButton name="arrow-left" onPress={() => navigation.goBack()} />
        <Txt variant="h1" style={{marginLeft: spacing.sm}}>
          Settings
        </Txt>
      </View>

      <Section title="Appearance">
        <Txt variant="label" tone="muted" style={{marginBottom: spacing.sm}}>
          Theme
        </Txt>
        <SegmentedControl
          value={mode}
          onChange={m => setMode(m as ThemeMode)}
          options={[
            {value: 'light', label: 'Light'},
            {value: 'dark', label: 'Dark'},
            {value: 'system', label: 'System'},
          ]}
        />
      </Section>

      <Section title="On-device AI">
        <RowItem
          icon="robot-happy"
          label="AI Coach (SmolLM2)"
          right={
            <Switch
              value={settings.enableAICoach}
              onValueChange={v => updateSettings({enableAICoach: v})}
              trackColor={{true: theme.primary}}
            />
          }
        />
        <RowItem
          icon="camera-iris"
          label="AI Food Scanner"
          last
          right={
            <Switch
              value={settings.enableAIScanner}
              onValueChange={v => updateSettings({enableAIScanner: v})}
              trackColor={{true: theme.primary}}
            />
          }
        />
      </Section>

      <Section title="Reminders">
        <RowItem
          icon="cup-water"
          label="Water nudges"
          right={
            <Switch
              value={settings.reminderWaterEnabled}
              onValueChange={v => toggleReminder({reminderWaterEnabled: v})}
              trackColor={{true: theme.water}}
            />
          }
        />
        {settings.reminderWaterEnabled ? (
          <Input
            label="Nudge every (minutes)"
            keyboardType="number-pad"
            value={waterInterval}
            onChangeText={setWaterInterval}
            suffix="min"
            containerStyle={{marginBottom: spacing.md}}
          />
        ) : null}
        <RowItem
          icon="silverware-fork-knife"
          label="Meal reminders (8:00 / 13:00 / 19:00)"
          right={
            <Switch
              value={settings.reminderMealsEnabled}
              onValueChange={v => toggleReminder({reminderMealsEnabled: v})}
              trackColor={{true: theme.primary}}
            />
          }
        />
        <RowItem
          icon="sword-cross"
          label="Daily quest reminder (9:00)"
          last
          right={
            <Switch
              value={settings.reminderQuestEnabled}
              onValueChange={v => toggleReminder({reminderQuestEnabled: v})}
              trackColor={{true: theme.primary}}
            />
          }
        />
      </Section>

      <Section title="Profile">
        <Input label="Name" value={name} onChangeText={setName} containerStyle={{marginBottom: spacing.md}} />
        <View style={{flexDirection: 'row', gap: spacing.md}}>
          <Input label="Age" keyboardType="number-pad" value={age} onChangeText={setAge} suffix="yr" containerStyle={{flex: 1}} />
          <Input label="Height" keyboardType="number-pad" value={height} onChangeText={setHeight} suffix="cm" containerStyle={{flex: 1}} />
          <Input label="Weight" keyboardType="numeric" value={weight} onChangeText={setWeight} suffix="kg" containerStyle={{flex: 1}} />
        </View>

        <Txt variant="label" tone="muted" style={{marginTop: spacing.lg, marginBottom: spacing.sm}}>
          Activity
        </Txt>
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm}}>
          {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map(a => (
            <Chip
              key={a}
              label={ACTIVITY_LABELS[a].split(' (')[0]}
              selected={profile?.activity === a}
              onPress={() => updateProfile({activity: a})}
            />
          ))}
        </View>

        <Txt variant="label" tone="muted" style={{marginTop: spacing.lg, marginBottom: spacing.sm}}>
          Goal
        </Txt>
        <SegmentedControl
          value={profile?.goal ?? 'maintain'}
          onChange={g => updateProfile({goal: g as GoalType})}
          options={(Object.keys(GOAL_LABELS) as GoalType[]).map(g => ({value: g, label: GOAL_LABELS[g]}))}
        />

        <Input
          label="Calorie target override (optional)"
          keyboardType="number-pad"
          value={override}
          onChangeText={setOverride}
          placeholder="Auto"
          suffix="kcal"
          containerStyle={{marginTop: spacing.lg}}
        />
      </Section>

      <Section title="Goals & Data">
        <View style={{flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md}}>
          <Input
            label="Cup size (one tap)"
            keyboardType="number-pad"
            value={cup}
            onChangeText={setCup}
            suffix="ml"
            containerStyle={{flex: 1}}
          />
          <Input
            label="Daily step goal"
            keyboardType="number-pad"
            value={stepGoal}
            onChangeText={setStepGoal}
            suffix="steps"
            containerStyle={{flex: 1}}
          />
        </View>
        <Input
          label="USDA FoodData Central API key"
          value={apiKey}
          onChangeText={setApiKey}
          autoCapitalize="none"
        />
        <Txt variant="caption" tone="faint" style={{marginTop: spacing.xs}}>
          Get a free key at fdc.nal.usda.gov. A working key is preconfigured.
        </Txt>
      </Section>

      <Button title="Save changes" icon="content-save" full onPress={saveProfile} style={{marginTop: spacing.xl}} />

      <Pressable onPress={confirmReset} style={{marginTop: spacing.lg, alignItems: 'center'}}>
        <Txt tone="danger" variant="label">
          Reset all data
        </Txt>
      </Pressable>

      <Txt variant="caption" tone="faint" center style={{marginTop: spacing.xl}}>
        NutriLife 2.0 — built with React Native + ONNX Runtime
      </Txt>
    </Screen>
  );
};

function clampNum(s: string, min: number, max: number, fallback: number) {
  const n = parseFloat(s);
  if (isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

export default SettingsScreen;
