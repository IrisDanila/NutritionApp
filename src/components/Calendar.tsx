import React from 'react';
import {View} from 'react-native';
import {useColors} from '../theme/ThemeContext';
import {radius, spacing} from '../theme/typography';
import {dateKey, todayKey} from '../utils/date';
import Txt from './Txt';
import IconButton from './IconButton';

export type DayStatus = 'met' | 'logged' | 'none';

interface CalendarProps {
  month: Date; // any day within the month to render
  statusOf: (dateKey: string) => DayStatus;
  onPrev: () => void;
  onNext: () => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WD = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const Calendar: React.FC<CalendarProps> = ({month, statusOf, onPrev, onNext}) => {
  const c = useColors();
  const year = month.getFullYear();
  const m = month.getMonth();
  const firstWeekday = new Date(year, m, 1).getDay();
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const today = todayKey();

  // Build cells (leading blanks + days).
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const cellColors: Record<DayStatus, {bg: string; fg: string}> = {
    met: {bg: c.primary, fg: c.textOnPrimary},
    logged: {bg: c.primarySoft, fg: c.text},
    none: {bg: 'transparent', fg: c.textMuted},
  };

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.md,
        }}>
        <IconButton name="chevron-left" tinted onPress={onPrev} />
        <Txt variant="h3">
          {MONTHS[m]} {year}
        </Txt>
        <IconButton name="chevron-right" tinted onPress={onNext} />
      </View>

      <View style={{flexDirection: 'row'}}>
        {WD.map((w, i) => (
          <View key={i} style={{flex: 1, alignItems: 'center', paddingVertical: spacing.xs}}>
            <Txt variant="caption" tone="faint">
              {w}
            </Txt>
          </View>
        ))}
      </View>

      <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
        {cells.map((d, i) => {
          if (d === null) return <View key={i} style={{width: `${100 / 7}%`, aspectRatio: 1}} />;
          const key = dateKey(new Date(year, m, d));
          const status = statusOf(key);
          const col = cellColors[status];
          const isToday = key === today;
          return (
            <View
              key={i}
              style={{width: `${100 / 7}%`, aspectRatio: 1, padding: 3}}>
              <View
                style={{
                  flex: 1,
                  borderRadius: radius.md,
                  backgroundColor: col.bg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: isToday ? 2 : 0,
                  borderColor: c.accent,
                }}>
                <Txt variant="label" color={col.fg}>
                  {d}
                </Txt>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default Calendar;
