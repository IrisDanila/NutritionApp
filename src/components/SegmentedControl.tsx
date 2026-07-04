import React from 'react';
import {Pressable, View} from 'react-native';
import {useColors} from '../theme/ThemeContext';
import {radius, spacing} from '../theme/typography';
import Txt from './Txt';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: Props<T>) {
  const c = useColors();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: c.bgSunken,
        borderRadius: radius.pill,
        padding: 4,
      }}>
      {options.map(opt => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={{
              flex: 1,
              paddingVertical: spacing.sm,
              borderRadius: radius.pill,
              alignItems: 'center',
              backgroundColor: active ? c.bgElevated : 'transparent',
              shadowColor: c.shadow,
              shadowOpacity: active ? 0.12 : 0,
              shadowRadius: 6,
              elevation: active ? 2 : 0,
            }}>
            <Txt variant="label" tone={active ? 'default' : 'muted'}>
              {opt.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export default SegmentedControl;
