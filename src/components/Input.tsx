import React from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  StyleProp,
  ViewStyle,
} from 'react-native';
import {useColors} from '../theme/ThemeContext';
import {radius, spacing, fonts} from '../theme/typography';
import Txt from './Txt';

interface InputProps extends TextInputProps {
  label?: string;
  suffix?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export const Input: React.FC<InputProps> = ({
  label,
  suffix,
  containerStyle,
  style,
  ...rest
}) => {
  const c = useColors();
  return (
    <View style={containerStyle}>
      {label ? (
        <Txt variant="label" tone="muted" style={{marginBottom: spacing.xs}}>
          {label}
        </Txt>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: c.bgSunken,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: c.border,
          paddingHorizontal: spacing.lg,
        }}>
        <TextInput
          placeholderTextColor={c.textFaint}
          style={[
            {
              flex: 1,
              color: c.text,
              paddingVertical: spacing.md,
              ...fonts.bodyLg,
            },
            style,
          ]}
          {...rest}
        />
        {suffix ? (
          <Txt variant="label" tone="faint">
            {suffix}
          </Txt>
        ) : null}
      </View>
    </View>
  );
};

export default Input;
