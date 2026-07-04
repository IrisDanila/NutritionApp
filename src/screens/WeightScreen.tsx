import React, {useState} from 'react';
import {View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import IconButton from '../components/IconButton';
import Input from '../components/Input';
import Button from '../components/Button';
import {LineChart} from '../components/Charts';
import {useTheme} from '../theme/ThemeContext';
import {spacing, radius} from '../theme/typography';
import {useAppStore} from '../store/useAppStore';
import {bmi, bmiCategory} from '../services/nutrition';
import {round} from '../utils/math';
import {shortDate} from '../utils/date';

export const WeightScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation();
  const profile = useAppStore(s => s.profile);
  const weights = useAppStore(s => s.weights);
  const addWeight = useAppStore(s => s.addWeight);
  const [value, setValue] = useState(`${profile?.weightKg ?? 70}`);

  const sorted = [...weights].sort((a, b) => (a.dateKey < b.dateKey ? -1 : 1));
  const values = sorted.map(w => w.weightKg);
  const labels = sorted.map(w => shortDate(w.dateKey));
  const trimmedLabels =
    labels.length > 6
      ? labels.map((l, i) =>
          i === 0 || i === labels.length - 1 || i === Math.floor(labels.length / 2)
            ? l
            : '',
        )
      : labels;

  const current = values[values.length - 1] ?? profile?.weightKg ?? 0;
  const start = values[0] ?? current;
  const delta = round(current - start, 1);

  const bmiVal = profile ? round(bmi({...profile, weightKg: current}), 1) : 0;
  const cat = bmiCategory(bmiVal);
  const toneColor = {success: theme.success, warning: theme.warning, danger: theme.danger}[cat.tone];

  const log = () => {
    const n = parseFloat(value);
    if (!isNaN(n) && n > 20 && n < 400) addWeight(n);
  };

  return (
    <Screen scroll>
      <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg}}>
        <IconButton name="arrow-left" onPress={() => navigation.goBack()} />
        <Txt variant="h1" style={{marginLeft: spacing.sm}}>
          Weight
        </Txt>
      </View>

      <Card>
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <View>
            <Txt variant="label" tone="muted">
              CURRENT
            </Txt>
            <Txt variant="displayLg">
              {round(current, 1)}
              <Txt variant="h2" tone="muted">
                {' '}
                kg
              </Txt>
            </Txt>
          </View>
          <View style={{alignItems: 'flex-end'}}>
            <Txt variant="label" tone="muted">
              CHANGE
            </Txt>
            <Txt
              variant="h1"
              color={delta < 0 ? theme.success : delta > 0 ? theme.accent : theme.textMuted}>
              {delta > 0 ? '+' : ''}
              {delta} kg
            </Txt>
          </View>
        </View>

        {values.length > 1 ? (
          <View style={{marginTop: spacing.lg}}>
            <LineChart values={values} labels={trimmedLabels} color={theme.primary} />
          </View>
        ) : (
          <Txt tone="faint" style={{marginTop: spacing.md}}>
            Log a few entries to see your trend.
          </Txt>
        )}
      </Card>

      {profile ? (
        <Card style={{marginTop: spacing.lg, flexDirection: 'row', alignItems: 'center'}}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: radius.md,
              backgroundColor: toneColor + '22',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Icon name="scale-bathroom" size={24} color={toneColor} />
          </View>
          <View style={{marginLeft: spacing.md, flex: 1}}>
            <Txt variant="h3">BMI {bmiVal}</Txt>
            <Txt variant="caption" color={toneColor}>
              {cat.label}
            </Txt>
          </View>
        </Card>
      ) : null}

      <Card style={{marginTop: spacing.lg}}>
        <Txt variant="h3" style={{marginBottom: spacing.md}}>
          Log today's weight
        </Txt>
        <View style={{flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md}}>
          <Input
            keyboardType="numeric"
            value={value}
            onChangeText={setValue}
            suffix="kg"
            containerStyle={{flex: 1}}
          />
          <Button title="Save" icon="check" onPress={log} />
        </View>
      </Card>
    </Screen>
  );
};

export default WeightScreen;
