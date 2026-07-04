import React from 'react';
import {View, ActivityIndicator} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useColors} from '../theme/ThemeContext';
import {radius, spacing} from '../theme/typography';
import Txt from './Txt';
import {ChatMessage} from '../store/types';

export const ChatBubble: React.FC<{message: ChatMessage}> = ({message}) => {
  const c = useColors();
  const isUser = message.role === 'user';
  const empty = message.pending && !message.content;

  const bubbleStyle = {
    maxWidth: '82%' as const,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
  };

  if (isUser) {
    return (
      <View style={{alignItems: 'flex-end', marginBottom: spacing.md}}>
        <LinearGradient
          colors={c.gradientPrimary}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={[bubbleStyle, {borderBottomRightRadius: radius.sm}]}>
          <Txt color={c.textOnPrimary}>{message.content}</Txt>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={{alignItems: 'flex-start', marginBottom: spacing.md}}>
      <View
        style={[
          bubbleStyle,
          {
            backgroundColor: c.bgElevated,
            borderBottomLeftRadius: radius.sm,
            borderWidth: 1,
            borderColor: c.border,
          },
        ]}>
        {empty ? (
          <ActivityIndicator color={c.primary} />
        ) : (
          <Txt>
            {message.content}
            {message.pending ? (
              <Txt tone="faint"> ▋</Txt>
            ) : null}
          </Txt>
        )}
      </View>
    </View>
  );
};

export default ChatBubble;
