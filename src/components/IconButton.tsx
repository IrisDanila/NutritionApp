import React from 'react';
import {Pressable, ViewStyle} from 'react-native';
import {useColors} from '../theme/ThemeContext';
import {radius} from '../theme/typography';
import Icon from './Icon';

interface IconButtonProps {
  name: string;
  onPress?: () => void;
  size?: number;
  color?: string;
  tinted?: boolean;
  style?: ViewStyle;
}

export const IconButton: React.FC<IconButtonProps> = ({
  name,
  onPress,
  size = 22,
  color,
  tinted,
  style,
}) => {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({pressed}) => [
        {
          width: 42,
          height: 42,
          borderRadius: radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: tinted ? c.bgSunken : 'transparent',
          opacity: pressed ? 0.6 : 1,
        },
        style,
      ]}>
      <Icon name={name} size={size} color={color ?? c.text} />
    </Pressable>
  );
};

export default IconButton;
