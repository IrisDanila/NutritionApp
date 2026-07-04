import React from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useColors} from '../theme/ThemeContext';

export interface IconProps {
  name: string;
  size?: number;
  color?: string;
}

/** Thin wrapper around MaterialCommunityIcons that defaults to the text color. */
export const Icon: React.FC<IconProps> = ({name, size = 22, color}) => {
  const c = useColors();
  return <MaterialCommunityIcons name={name} size={size} color={color ?? c.text} />;
};

export default Icon;
