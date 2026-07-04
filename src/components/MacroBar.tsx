import React from 'react';
import {View} from 'react-native';
import {useColors} from '../theme/ThemeContext';
import {radius, spacing} from '../theme/typography';
import {clamp, round} from '../utils/math';
import Txt from './Txt';

interface MacroBarProps {
  label: string;
  value: number; // grams consumed
  target: number; // grams target
  color: string;
}

export const MacroBar: React.FC<MacroBarProps> = ({
  label,
  value,
  target,
  color,
}) => {
  const c = useColors();
  const pct = target > 0 ? clamp(value / target, 0, 1) : 0;
  return (
    <View style={{flex: 1}}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: spacing.xs,
        }}>
        <Txt variant="caption" tone="muted">
          {label}
        </Txt>
      </View>
      <View
        style={{
          height: 8,
          borderRadius: radius.pill,
          backgroundColor: c.bgSunken,
          overflow: 'hidden',
        }}>
        <View
          style={{
            width: `${pct * 100}%`,
            height: '100%',
            backgroundColor: color,
            borderRadius: radius.pill,
          }}
        />
      </View>
      <Txt variant="caption" style={{marginTop: spacing.xs}}>
        {round(value)}
        <Txt variant="caption" tone="faint">
          {' '}
          / {round(target)}g
        </Txt>
      </Txt>
    </View>
  );
};

interface MacroRowProps {
  carbs: {value: number; target: number};
  protein: {value: number; target: number};
  fat: {value: number; target: number};
}

export const MacroRow: React.FC<MacroRowProps> = ({carbs, protein, fat}) => {
  const c = useColors();
  return (
    <View style={{flexDirection: 'row', gap: spacing.lg}}>
      <MacroBar label="Carbs" value={carbs.value} target={carbs.target} color={c.carbs} />
      <MacroBar label="Protein" value={protein.value} target={protein.target} color={c.protein} />
      <MacroBar label="Fat" value={fat.value} target={fat.target} color={c.fat} />
    </View>
  );
};

export default MacroBar;
