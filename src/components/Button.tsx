import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useColors} from '../theme/ThemeContext';
import {radius, spacing} from '../theme/typography';
import Txt from './Txt';
import Icon from './Icon';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  full?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  disabled,
  full,
  style,
}) => {
  const c = useColors();
  const heights: Record<Size, number> = {sm: 38, md: 50, lg: 58};
  const height = heights[size];

  const isDisabled = disabled || loading;
  const radii = radius.pill;

  const content = (color: string) => (
    <View style={styles.row}>
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={size === 'sm' ? 16 : 20} color={color} /> : null}
          <Txt
            variant={size === 'sm' ? 'label' : 'h3'}
            color={color}
            style={icon ? {marginLeft: spacing.sm} : undefined}>
            {title}
          </Txt>
        </>
      )}
    </View>
  );

  const base: ViewStyle = {
    height,
    borderRadius: radii,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: isDisabled ? 0.5 : 1,
    ...(full ? {alignSelf: 'stretch'} : null),
  };

  if (variant === 'primary') {
    return (
      <Pressable onPress={onPress} disabled={isDisabled} style={({pressed}) => [pressed && styles.pressed, full && {alignSelf: 'stretch'}, style]}>
        <LinearGradient
          colors={c.gradientPrimary}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={base}>
          {content(c.textOnPrimary)}
        </LinearGradient>
      </Pressable>
    );
  }

  const variantStyle: ViewStyle =
    variant === 'secondary'
      ? {backgroundColor: c.primarySoft}
      : variant === 'danger'
      ? {backgroundColor: c.danger}
      : {backgroundColor: 'transparent', borderWidth: 1.5, borderColor: c.border};

  const textColor =
    variant === 'danger'
      ? c.textOnPrimary
      : variant === 'secondary'
      ? c.primary
      : c.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({pressed}) => [base, variantStyle, pressed && styles.pressed, style]}>
      {content(textColor)}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center'},
  pressed: {opacity: 0.85, transform: [{scale: 0.99}]},
});

export default Button;
