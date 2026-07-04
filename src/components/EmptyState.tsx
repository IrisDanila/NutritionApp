import React from 'react';
import {View} from 'react-native';
import {useColors} from '../theme/ThemeContext';
import {radius, spacing} from '../theme/typography';
import Txt from './Txt';
import Icon from './Icon';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  subtitle,
  children,
}) => {
  const c = useColors();
  return (
    <View style={{alignItems: 'center', paddingVertical: spacing.xxl}}>
      <View
        style={{
          width: 76,
          height: 76,
          borderRadius: radius.xl,
          backgroundColor: c.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.lg,
        }}>
        <Icon name={icon} size={36} color={c.primary} />
      </View>
      <Txt variant="h3" center>
        {title}
      </Txt>
      {subtitle ? (
        <Txt
          variant="body"
          tone="muted"
          center
          style={{marginTop: spacing.xs, maxWidth: 280}}>
          {subtitle}
        </Txt>
      ) : null}
      {children ? <View style={{marginTop: spacing.lg}}>{children}</View> : null}
    </View>
  );
};

export default EmptyState;
