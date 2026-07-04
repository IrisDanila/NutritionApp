import React from 'react';
import {View, Pressable} from 'react-native';
import {useTheme} from '../theme/ThemeContext';
import {radius, spacing} from '../theme/typography';
import {CATEGORY_META} from '../services/challenges';
import {DailyChallenge} from '../hooks/useGamification';
import Card from './Card';
import Txt from './Txt';
import Icon from './Icon';

interface ChallengeCardProps {
  item: DailyChallenge;
  onToggle?: () => void;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({item, onToggle}) => {
  const {theme} = useTheme();
  const {challenge, complete} = item;
  const meta = CATEGORY_META[challenge.category];

  return (
    <Card
      style={{
        marginBottom: spacing.md,
        borderColor: complete ? meta.color : theme.border,
        borderWidth: complete ? 1.5 : 1,
        overflow: 'hidden',
      }}
      padded={false}>
      <View style={{flexDirection: 'row', alignItems: 'center', padding: spacing.lg}}>
        {/* Category accent stripe */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 5,
            backgroundColor: meta.color,
          }}
        />
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: radius.md,
            backgroundColor: meta.color + '22',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing.md,
          }}>
          <Icon name={challenge.icon} size={24} color={meta.color} />
        </View>

        <View style={{flex: 1}}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Txt variant="h3" style={complete ? {textDecorationLine: 'line-through'} : undefined}>
              {challenge.title}
            </Txt>
            <View
              style={{
                marginLeft: spacing.sm,
                backgroundColor: theme.primarySoft,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: radius.pill,
              }}>
              <Txt variant="caption" tone="primary">
                +{challenge.xp} XP
              </Txt>
            </View>
          </View>
          <Txt variant="caption" tone="muted" style={{marginTop: 2}}>
            {challenge.description}
          </Txt>
        </View>

        {/* Status / action */}
        {complete ? (
          <Icon name="check-circle" size={28} color={meta.color} />
        ) : challenge.type === 'manual' ? (
          <Pressable
            onPress={onToggle}
            hitSlop={8}
            style={{
              borderWidth: 2,
              borderColor: theme.border,
              borderRadius: radius.pill,
              paddingHorizontal: spacing.md,
              paddingVertical: 6,
            }}>
            <Txt variant="caption" tone="muted">
              Done
            </Txt>
          </Pressable>
        ) : (
          <View style={{alignItems: 'center'}}>
            <Icon name="progress-clock" size={22} color={theme.textFaint} />
            <Txt variant="caption" tone="faint" style={{fontSize: 10}}>
              auto
            </Txt>
          </View>
        )}
      </View>
    </Card>
  );
};

export default ChallengeCard;
