import React, {useMemo, useState} from 'react';
import {View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Txt from '../components/Txt';
import IconButton from '../components/IconButton';
import Calendar, {DayStatus} from '../components/Calendar';
import {useTheme} from '../theme/ThemeContext';
import {spacing, radius} from '../theme/typography';
import {useAppStore} from '../store/useAppStore';
import {useTargets} from '../hooks/useNutrition';
import {sumEntries} from '../services/nutrition';
import {dateKey} from '../utils/date';

export const GoalCalendarScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation();
  const diary = useAppStore(s => s.diary);
  const targets = useTargets();
  const [month, setMonth] = useState(new Date());

  const statusOf = useMemo(
    () =>
      (key: string): DayStatus => {
        const entries = diary[key];
        if (!entries || entries.length === 0) return 'none';
        if (!targets) return 'logged';
        const cals = sumEntries(entries).calories;
        // "Met goal" = ate something and stayed at/under the calorie target.
        return cals > 0 && cals <= targets.calories ? 'met' : 'logged';
      },
    [diary, targets],
  );

  // Stats for the visible month.
  const stats = useMemo(() => {
    const y = month.getFullYear();
    const m = month.getMonth();
    const days = new Date(y, m + 1, 0).getDate();
    let met = 0;
    let logged = 0;
    for (let d = 1; d <= days; d++) {
      const s = statusOf(dateKey(new Date(y, m, d)));
      if (s === 'met') met++;
      else if (s === 'logged') logged++;
    }
    return {met, logged};
  }, [month, statusOf]);

  const shift = (delta: number) =>
    setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));

  return (
    <Screen scroll>
      <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg}}>
        <IconButton name="arrow-left" onPress={() => navigation.goBack()} />
        <Txt variant="h1" style={{marginLeft: spacing.sm}}>
          Goal Calendar
        </Txt>
      </View>

      <Card>
        <Calendar month={month} statusOf={statusOf} onPrev={() => shift(-1)} onNext={() => shift(1)} />
      </Card>

      {/* Legend */}
      <Card flat style={{marginTop: spacing.lg, backgroundColor: theme.bgSunken, borderColor: 'transparent'}}>
        <View style={{flexDirection: 'row', justifyContent: 'space-around'}}>
          <Legend color={theme.primary} label="Goal met" />
          <Legend color={theme.primarySoft} label="Logged (over)" border={theme.border} />
          <Legend color={theme.accent} label="Today" outline />
        </View>
      </Card>

      <View style={{flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg}}>
        <Card style={{flex: 1, alignItems: 'center'}}>
          <Txt variant="display" tone="primary">
            {stats.met}
          </Txt>
          <Txt tone="muted" variant="caption">
            days on target
          </Txt>
        </Card>
        <Card style={{flex: 1, alignItems: 'center'}}>
          <Txt variant="display">{stats.met + stats.logged}</Txt>
          <Txt tone="muted" variant="caption">
            days logged
          </Txt>
        </Card>
      </View>

      <Txt variant="caption" tone="faint" center style={{marginTop: spacing.lg}}>
        A day counts as "on target" when you logged food and stayed at or under
        your calorie goal.
      </Txt>
    </Screen>
  );
};

const Legend: React.FC<{color: string; label: string; border?: string; outline?: boolean}> = ({
  color,
  label,
  border,
  outline,
}) => (
  <View style={{flexDirection: 'row', alignItems: 'center'}}>
    <View
      style={{
        width: 16,
        height: 16,
        borderRadius: 5,
        marginRight: 6,
        backgroundColor: outline ? 'transparent' : color,
        borderWidth: outline || border ? 2 : 0,
        borderColor: color,
      }}
    />
    <Txt variant="caption" tone="muted">
      {label}
    </Txt>
  </View>
);

export default GoalCalendarScreen;
