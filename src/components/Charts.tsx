import React from 'react';
import {View} from 'react-native';
import Svg, {
  Rect,
  Line,
  Polyline,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Polygon,
} from 'react-native-svg';
import {useColors} from '../theme/ThemeContext';
import Txt from './Txt';
import {spacing} from '../theme/typography';

interface BarDatum {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarDatum[];
  height?: number;
  target?: number;
  color?: string;
  unit?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  height = 160,
  target,
  color,
  unit,
}) => {
  const c = useColors();
  const accent = color ?? c.primary;
  const max = Math.max(target ?? 0, ...data.map(d => d.value), 1) * 1.15;
  const barGap = 10;
  const n = data.length || 1;

  return (
    <View>
      <Svg width="100%" height={height} viewBox={`0 0 ${n * 40} ${height}`}>
        {target ? (
          <Line
            x1={0}
            y1={height - (target / max) * height}
            x2={n * 40}
            y2={height - (target / max) * height}
            stroke={c.textFaint}
            strokeDasharray="4 4"
            strokeWidth={1}
          />
        ) : null}
        {data.map((d, i) => {
          const bw = 40 - barGap;
          const bh = Math.max(2, (d.value / max) * (height - 4));
          const x = i * 40 + barGap / 2;
          const y = height - bh;
          const over = target ? d.value > target : false;
          return (
            <Rect
              key={i}
              x={x}
              y={y}
              width={bw}
              height={bh}
              rx={6}
              fill={over ? c.warning : accent}
              opacity={d.value === 0 ? 0.25 : 1}
            />
          );
        })}
      </Svg>
      <View style={{flexDirection: 'row', marginTop: spacing.xs}}>
        {data.map((d, i) => (
          <View key={i} style={{flex: 1, alignItems: 'center'}}>
            <Txt variant="caption" tone="faint">
              {d.label}
            </Txt>
          </View>
        ))}
      </View>
      {unit ? (
        <Txt variant="caption" tone="faint" style={{marginTop: 2}}>
          {unit}
        </Txt>
      ) : null}
    </View>
  );
};

interface LineChartProps {
  values: number[];
  labels?: string[];
  height?: number;
  color?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  values,
  labels,
  height = 160,
  color,
}) => {
  const c = useColors();
  const accent = color ?? c.primary;
  const W = 300;
  const H = height;
  const pad = 8;

  if (values.length === 0) {
    return <View style={{height}} />;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = (W - pad * 2) / Math.max(1, values.length - 1);

  const pts = values.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (1 - (v - min) / range) * (H - pad * 2);
    return {x, y};
  });

  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ');
  const area =
    `${pad},${H - pad} ` +
    pts.map(p => `${p.x},${p.y}`).join(' ') +
    ` ${pad + (values.length - 1) * stepX},${H - pad}`;

  return (
    <View>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <LinearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={accent} stopOpacity={0.28} />
            <Stop offset="1" stopColor={accent} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Polygon points={area} fill="url(#lineFill)" />
        <Polyline
          points={polyline}
          fill="none"
          stroke={accent}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {pts.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={3} fill={accent} />
        ))}
      </Svg>
      {labels ? (
        <View style={{flexDirection: 'row', marginTop: spacing.xs}}>
          {labels.map((l, i) => (
            <View key={i} style={{flex: 1, alignItems: 'center'}}>
              <Txt variant="caption" tone="faint">
                {l}
              </Txt>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
};
