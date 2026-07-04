import React from 'react';
import {Pressable, ViewStyle} from 'react-native';
import {useColors} from '../theme/ThemeContext';
import {radius, spacing} from '../theme/typography';
import Txt from './Txt';
import Icon from './Icon';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: string;
  color?: string;
  style?: ViewStyle;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected,
  onPress,
  icon,
  color,
  style,
}) => {
  const c = useColors();
  const accent = color ?? c.primary;
  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          borderRadius: radius.pill,
          backgroundColor: selected ? accent : c.bgSunken,
          borderWidth: 1,
          borderColor: selected ? accent : c.border,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}>
      {icon ? (
        <Icon
          name={icon}
          size={15}
          color={selected ? c.textOnPrimary : c.textMuted}
        />
      ) : null}
      <Txt
        variant="label"
        color={selected ? c.textOnPrimary : c.textMuted}
        style={icon ? {marginLeft: 6} : undefined}>
        {label}
      </Txt>
    </Pressable>
  );
};

export default Chip;
