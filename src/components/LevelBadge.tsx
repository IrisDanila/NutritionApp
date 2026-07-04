import React from 'react';
import {View} from 'react-native';
import Svg, {Polygon, Defs, LinearGradient, Stop} from 'react-native-svg';
import Txt from './Txt';

interface LevelBadgeProps {
  level: number;
  color: string;
  size?: number;
}

/** A hexagonal rank emblem (pure SVG) with the level number in the centre. */
export const LevelBadge: React.FC<LevelBadgeProps> = ({level, color, size = 64}) => {
  const c = size / 2;
  const r = size / 2 - 2;
  // Pointy-top hexagon.
  const pts = Array.from({length: 6}, (_, i) => {
    const ang = (Math.PI / 180) * (60 * i - 90);
    return `${c + r * Math.cos(ang)},${c + r * Math.sin(ang)}`;
  }).join(' ');

  const lighten = color + 'CC';

  return (
    <View style={{width: size, height: size}}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id={`badge-${level}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={lighten} />
            <Stop offset="1" stopColor={color} />
          </LinearGradient>
        </Defs>
        <Polygon
          points={pts}
          fill={`url(#badge-${level})`}
          stroke="#FFFFFF"
          strokeWidth={size * 0.04}
          strokeOpacity={0.35}
        />
      </Svg>
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
        <Txt variant="caption" color="#FFFFFF" style={{opacity: 0.85, fontSize: size * 0.13}}>
          LVL
        </Txt>
        <Txt color="#FFFFFF" style={{fontSize: size * 0.36, fontWeight: '800', marginTop: -2}}>
          {level}
        </Txt>
      </View>
    </View>
  );
};

export default LevelBadge;
