import React from 'react';
import {View} from 'react-native';
import {useColors} from '../theme/ThemeContext';
import {radius, spacing} from '../theme/typography';
import Txt from './Txt';
import Icon from './Icon';

interface StatTileProps {
  icon: string;
  label: string;
  value: string;
  unit?: string;
  tint?: string;
}

export const StatTile: React.FC<StatTileProps> = ({
  icon,
  label,
  value,
  unit,
  tint,
}) => {
  const c = useColors();
  const color = tint ?? c.primary;
  return (
    <View style={{flex: 1}}>
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: radius.md,
          backgroundColor: color + '22',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.sm,
        }}>
        <Icon name={icon} size={20} color={color} />
      </View>
      <Txt variant="h3">
        {value}
        {unit ? (
          <Txt variant="caption" tone="faint">
            {' '}
            {unit}
          </Txt>
        ) : null}
      </Txt>
      <Txt variant="caption" tone="muted">
        {label}
      </Txt>
    </View>
  );
};

export default StatTile;
