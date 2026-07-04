import React from 'react';
import {View, Pressable} from 'react-native';
import {useColors} from '../theme/ThemeContext';
import {radius, spacing} from '../theme/typography';
import {FoodEntry} from '../store/types';
import {round} from '../utils/math';
import Txt from './Txt';
import Icon from './Icon';

const SOURCE_ICON: Record<FoodEntry['source'], string> = {
  usda: 'database-search',
  'ai-scan': 'camera-iris',
  manual: 'pencil',
};

interface FoodRowProps {
  entry: FoodEntry;
  onPress?: () => void;
  onDelete?: () => void;
}

export const FoodRow: React.FC<FoodRowProps> = ({entry, onPress, onDelete}) => {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        opacity: pressed ? 0.7 : 1,
      })}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.md,
          backgroundColor: c.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing.md,
        }}>
        <Icon name={SOURCE_ICON[entry.source]} size={18} color={c.primary} />
      </View>
      <View style={{flex: 1}}>
        <Txt variant="bodyLg" numberOfLines={1}>
          {entry.name}
        </Txt>
        <Txt variant="caption" tone="muted">
          {round(entry.amount)} {entry.unit} · {round(entry.protein)}P /{' '}
          {round(entry.carbs)}C / {round(entry.fat)}F
          {entry.confidence
            ? ` · ${Math.round(entry.confidence * 100)}%`
            : ''}
        </Txt>
      </View>
      <Txt variant="h3" style={{marginRight: onDelete ? spacing.md : 0}}>
        {round(entry.calories)}
        <Txt variant="caption" tone="faint">
          {' '}
          kcal
        </Txt>
      </Txt>
      {onDelete ? (
        <Pressable onPress={onDelete} hitSlop={10}>
          <Icon name="close-circle" size={20} color={c.textFaint} />
        </Pressable>
      ) : null}
    </Pressable>
  );
};

export default FoodRow;
