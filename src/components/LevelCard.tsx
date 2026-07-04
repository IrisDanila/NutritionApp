import React from 'react';
import {View, Pressable} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {radius, spacing} from '../theme/typography';
import {LevelInfo} from '../services/levels';
import Txt from './Txt';
import Icon from './Icon';
import LevelBadge from './LevelBadge';

interface LevelCardProps {
  level: LevelInfo;
  onPress?: () => void;
  subtitle?: string;
}

/** Hero card showing rank emblem, level, XP progress and total XP. */
export const LevelCard: React.FC<LevelCardProps> = ({level, onPress, subtitle}) => {
  const inner = (
      <LinearGradient
        colors={[level.rank.color, shade(level.rank.color)]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={{borderRadius: radius.lg, padding: spacing.lg}}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <LevelBadge level={level.level} color={shade(level.rank.color)} size={64} />
          <View style={{flex: 1, marginLeft: spacing.lg}}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Icon name={level.rank.icon} size={16} color="#fff" />
              <Txt variant="h3" color="#fff" style={{marginLeft: 6}}>
                {level.rank.title}
              </Txt>
            </View>
            <Txt color="#fff" style={{opacity: 0.9}}>
              {subtitle ?? `Level ${level.level}`}
            </Txt>
          </View>
          <Txt variant="h2" color="#fff">
            {level.totalXp}
            <Txt variant="caption" color="#fff" style={{opacity: 0.85}}>
              {' '}
              XP
            </Txt>
          </Txt>
        </View>

        <View
          style={{
            height: 10,
            borderRadius: radius.pill,
            backgroundColor: 'rgba(255,255,255,0.28)',
            marginTop: spacing.lg,
            overflow: 'hidden',
          }}>
          <View
            style={{
              width: `${level.progress * 100}%`,
              height: '100%',
              backgroundColor: '#fff',
              borderRadius: radius.pill,
            }}
          />
        </View>
        <Txt variant="caption" color="#fff" style={{opacity: 0.9, marginTop: 6}}>
          {level.xpIntoLevel} / {level.xpForNext} XP to level {level.level + 1}
        </Txt>
      </LinearGradient>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({pressed}) => (pressed ? {opacity: 0.9} : undefined)}>
        {inner}
      </Pressable>
    );
  }
  return inner;
};

/** Darken a hex colour ~25% for the gradient end. */
function shade(hex: string): string {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(x => x + x).join('') : h, 16);
  const r = Math.max(0, ((n >> 16) & 255) * 0.7);
  const g = Math.max(0, ((n >> 8) & 255) * 0.7);
  const b = Math.max(0, (n & 255) * 0.7);
  return `rgb(${r | 0}, ${g | 0}, ${b | 0})`;
}

export default LevelCard;
