import React from 'react';
import {View, Pressable} from 'react-native';
import {spacing} from '../theme/typography';
import Txt from './Txt';

interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
  style?: object;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  action,
  onAction,
  style,
}) => (
  <View
    style={[
      {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
      },
      style,
    ]}>
    <Txt variant="h2">{title}</Txt>
    {action ? (
      <Pressable onPress={onAction} hitSlop={8}>
        <Txt variant="label" tone="primary">
          {action}
        </Txt>
      </Pressable>
    ) : null}
  </View>
);

export default SectionHeader;
