import React from 'react';
import {View} from 'react-native';
import Svg, {Defs, LinearGradient, Stop, Path, Rect, ClipPath} from 'react-native-svg';
import {useColors} from '../theme/ThemeContext';
import {clamp} from '../utils/math';

interface WaterGlassProps {
  progress: number; // 0..1
  size?: number;
}

/** A stylised glass that fills from the bottom according to `progress`. */
export const WaterGlass: React.FC<WaterGlassProps> = ({progress, size = 150}) => {
  const c = useColors();
  const w = size * 0.7;
  const h = size;
  const p = clamp(progress, 0, 1);

  // Glass body as a slightly tapered rounded rectangle.
  const topInset = w * 0.08;
  const glassPath = `
    M ${topInset} 6
    L ${w - topInset} 6
    L ${w - 2} ${h - 6}
    Q ${w - 2} ${h} ${w - 8} ${h}
    L 8 ${h}
    Q 2 ${h} 2 ${h - 6}
    Z`;

  const fillTop = 6 + (h - 12) * (1 - p);

  return (
    <View style={{width: w, height: h}}>
      <Svg width={w} height={h}>
        <Defs>
          <LinearGradient id="water" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={c.gradientWater[0]} />
            <Stop offset="1" stopColor={c.gradientWater[1]} />
          </LinearGradient>
          <ClipPath id="glassClip">
            <Path d={glassPath} />
          </ClipPath>
        </Defs>

        {/* Glass background */}
        <Path d={glassPath} fill={c.bgSunken} />

        {/* Water fill clipped to the glass shape */}
        <Rect
          x={0}
          y={fillTop}
          width={w}
          height={h - fillTop}
          fill="url(#water)"
          clipPath="url(#glassClip)"
        />

        {/* Glass outline */}
        <Path d={glassPath} fill="none" stroke={c.border} strokeWidth={2} />
      </Svg>
    </View>
  );
};

export default WaterGlass;
