import React, {useMemo, useState} from 'react';
import {View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import IconButton from '../components/IconButton';
import SegmentedControl from '../components/SegmentedControl';
import StatTile from '../components/StatTile';
import {BarChart} from '../components/Charts';
import {useTheme} from '../theme/ThemeContext';
import {spacing, radius} from '../theme/typography';
import {useAppStore} from '../store/useAppStore';
import {useTargets} from '../hooks/useNutrition';
import {sumEntries} from '../services/nutrition';
import {lastNDays, prettyDate, weekdayLetter} from '../utils/date';
import {round} from '../utils/math';

export const HistoryScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation();
  const diary = useAppStore(s => s.diary);
  const water = useAppStore(s => s.water);
  const targets = useTargets();
  const [range, setRange] = useState<'7' | '30'>('7');

  const days = lastNDays(range === '7' ? 7 : 30);

  const daily = useMemo(
    () =>
      days.map(k => {
        const entries = diary[k] ?? [];
        const totals = sumEntries(entries);
        return {key: k, totals, count: entries.length, water: water[k] ?? 0};
      }),
    [days, diary, water],
  );

  const loggedDays = daily.filter(d => d.count > 0);
  const avgCals = loggedDays.length
    ? Math.round(
        loggedDays.reduce((a, d) => a + d.totals.calories, 0) / loggedDays.length,
      )
    : 0;
  const avgProtein = loggedDays.length
    ? Math.round(
        loggedDays.reduce((a, d) => a + d.totals.protein, 0) / loggedDays.length,
      )
    : 0;
  const adherence = targets && loggedDays.length
    ? Math.round(
        (loggedDays.filter(
          d => Math.abs(d.totals.calories - targets.calories) <= targets.calories * 0.12,
        ).length /
          loggedDays.length) *
          100,
      )
    : 0;

  const calChart = daily.map(d => ({
    label: range === '7' ? weekdayLetter(d.key) : '',
    value: Math.round(d.totals.calories),
  }));

  return (
    <Screen scroll>
      <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg}}>
        <IconButton name="arrow-left" onPress={() => navigation.goBack()} />
        <Txt variant="h1" style={{marginLeft: spacing.sm, flex: 1}}>
          History
        </Txt>
      </View>

      <SegmentedControl
        value={range}
        onChange={setRange}
        options={[
          {value: '7', label: 'Last 7 days'},
          {value: '30', label: 'Last 30 days'},
        ]}
      />

      <Card style={{marginTop: spacing.lg}}>
        <Txt variant="h3" style={{marginBottom: spacing.md}}>
          Calories
        </Txt>
        <BarChart data={calChart} target={targets?.calories} unit="kcal/day" />
      </Card>

      <View style={{flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg}}>
        <Card style={{flex: 1}}>
          <StatTile icon="fire" label="Avg calories" value={`${avgCals}`} unit="kcal" tint={theme.calories} />
        </Card>
        <Card style={{flex: 1}}>
          <StatTile icon="food-drumstick" label="Avg protein" value={`${avgProtein}`} unit="g" tint={theme.protein} />
        </Card>
      </View>
      <View style={{flexDirection: 'row', gap: spacing.md, marginTop: spacing.md}}>
        <Card style={{flex: 1}}>
          <StatTile icon="calendar-check" label="Days logged" value={`${loggedDays.length}`} tint={theme.primary} />
        </Card>
        <Card style={{flex: 1}}>
          <StatTile icon="target" label="On-target days" value={`${adherence}`} unit="%" tint={theme.accent} />
        </Card>
      </View>

      <Txt variant="h3" style={{marginTop: spacing.xl, marginBottom: spacing.sm}}>
        Daily log
      </Txt>
      <Card padded={false} style={{paddingHorizontal: spacing.lg}}>
        {[...daily].reverse().map((d, i, arr) => (
          <View
            key={d.key}
            style={[
              {flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md},
              i < arr.length - 1 && {borderBottomWidth: 1, borderBottomColor: theme.border},
            ]}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: radius.md,
                backgroundColor: d.count ? theme.primarySoft : theme.bgSunken,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: spacing.md,
              }}>
              <Icon
                name={d.count ? 'silverware-fork-knife' : 'minus'}
                size={18}
                color={d.count ? theme.primary : theme.textFaint}
              />
            </View>
            <View style={{flex: 1}}>
              <Txt variant="bodyLg">{prettyDate(d.key)}</Txt>
              <Txt variant="caption" tone="muted">
                {d.count
                  ? `${d.count} items · ${round(d.totals.protein)}P / ${round(d.totals.carbs)}C / ${round(d.totals.fat)}F`
                  : 'No entries'}
              </Txt>
            </View>
            <View style={{alignItems: 'flex-end'}}>
              <Txt variant="h3">{round(d.totals.calories)}</Txt>
              <Txt variant="caption" tone="faint">
                {(d.water / 1000).toFixed(1)}L water
              </Txt>
            </View>
          </View>
        ))}
      </Card>
    </Screen>
  );
};

export default HistoryScreen;
