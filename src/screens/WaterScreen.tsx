import React from 'react';
import {View, Pressable} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import IconButton from '../components/IconButton';
import WaterGlass from '../components/WaterGlass';
import Chip from '../components/Chip';
import {BarChart} from '../components/Charts';
import {useTheme} from '../theme/ThemeContext';
import {radius, spacing} from '../theme/typography';
import {useAppStore} from '../store/useAppStore';
import {useTargets} from '../hooks/useNutrition';
import {lastNDays, todayKey, weekdayLetter} from '../utils/date';
import {clamp} from '../utils/math';

const QUICK = [100, 250, 500, 750];

export const WaterScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation();
  const today = todayKey();
  const water = useAppStore(s => s.water);
  const addWater = useAppStore(s => s.addWater);
  const setWater = useAppStore(s => s.setWater);
  const cup = useAppStore(s => s.settings.waterCupMl);
  const targets = useTargets();

  const todayMl = water[today] ?? 0;
  const goal = targets?.waterMl ?? 2500;
  const progress = clamp(todayMl / goal, 0, 1);
  const cups = (todayMl / cup).toFixed(1);

  const week = lastNDays(7).map(k => ({
    label: weekdayLetter(k),
    value: water[k] ?? 0,
  }));

  return (
    <Screen scroll>
      <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg}}>
        <IconButton name="arrow-left" onPress={() => navigation.goBack()} />
        <Txt variant="h1" style={{marginLeft: spacing.sm}}>
          Hydration
        </Txt>
      </View>

      <Card style={{alignItems: 'center'}}>
        <WaterGlass progress={progress} size={170} />
        <Txt variant="displayLg" color={theme.water} style={{marginTop: spacing.lg}}>
          {(todayMl / 1000).toFixed(2)}L
        </Txt>
        <Txt tone="muted">
          {Math.round(progress * 100)}% of {(goal / 1000).toFixed(1)}L goal · {cups} cups
        </Txt>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: spacing.xl,
            gap: spacing.lg,
          }}>
          <IconButton
            name="minus"
            tinted
            size={26}
            onPress={() => addWater(-cup)}
          />
          <Pressable
            onPress={() => addWater(cup)}
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              backgroundColor: theme.water,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Icon name="plus" size={34} color="#fff" />
            <Txt variant="caption" color="#fff">
              {cup}ml
            </Txt>
          </Pressable>
          <IconButton
            name="restart"
            tinted
            size={24}
            onPress={() => setWater(0)}
          />
        </View>
      </Card>

      <Txt variant="h3" style={{marginTop: spacing.xl, marginBottom: spacing.sm}}>
        Quick add
      </Txt>
      <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm}}>
        {QUICK.map(q => (
          <Chip
            key={q}
            label={`+${q}ml`}
            icon="cup-water"
            color={theme.water}
            onPress={() => addWater(q)}
          />
        ))}
      </View>

      <Card style={{marginTop: spacing.xl}}>
        <Txt variant="h3" style={{marginBottom: spacing.md}}>
          Last 7 days
        </Txt>
        <BarChart data={week} target={goal} color={theme.water} />
      </Card>
    </Screen>
  );
};

export default WaterScreen;
