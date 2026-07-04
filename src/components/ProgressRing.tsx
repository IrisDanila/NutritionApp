import React from 'react';
import {View} from 'react-native';
import Svg, {Circle, G} from 'react-native-svg';
import {useColors} from '../theme/ThemeContext';
import {clamp} from '../utils/math';

interface ProgressRingProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0..1 (can exceed 1; visually capped)
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
}

/** Static circular progress ring with optional center content. */
export const ProgressRing: React.FC<ProgressRingProps> = ({
  size = 180,
  strokeWidth = 16,
  progress,
  color,
  trackColor,
  children,
}) => {
  const c = useColors();
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const p = clamp(progress, 0, 1);
  const dash = circumference * p;

  return (
    <View style={{width: size, height: size}}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={trackColor ?? c.bgSunken}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color ?? c.primary}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${dash}, ${circumference}`}
            fill="none"
          />
        </G>
      </Svg>
      {children ? (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {children}
        </View>
      ) : null}
    </View>
  );
};

export default ProgressRing;
