import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import {useColors} from '../theme/ThemeContext';
import {radius, spacing} from '../theme/typography';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  padded?: boolean;
  /** Disable shadow/elevation — use for tinted/translucent backgrounds, where
   *  Android would otherwise fill the elevation rect with the shadow colour. */
  flat?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  padded = true,
  flat = false,
}) => {
  const c = useColors();
  const base: ViewStyle = {
    backgroundColor: c.bgElevated,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    padding: padded ? spacing.lg : 0,
    shadowColor: flat ? 'transparent' : c.shadow,
    shadowOpacity: flat ? 0 : 0.08,
    shadowRadius: flat ? 0 : 12,
    shadowOffset: {width: 0, height: flat ? 0 : 4},
    elevation: flat ? 0 : 2,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({pressed}) => [base, pressed && {opacity: 0.85}, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
};

export default Card;
