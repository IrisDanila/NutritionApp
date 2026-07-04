import React from 'react';
import {Text as RNText, TextProps, TextStyle} from 'react-native';
import {useColors} from '../theme/ThemeContext';
import {fonts} from '../theme/typography';

type Variant = keyof typeof fonts;
type Tone = 'default' | 'muted' | 'faint' | 'primary' | 'onPrimary' | 'danger';

interface TxtProps extends TextProps {
  variant?: Variant;
  tone?: Tone;
  color?: string;
  center?: boolean;
}

/** Themed text primitive. */
export const Txt: React.FC<TxtProps> = ({
  variant = 'body',
  tone = 'default',
  color,
  center,
  style,
  children,
  ...rest
}) => {
  const c = useColors();
  const toneColor: Record<Tone, string> = {
    default: c.text,
    muted: c.textMuted,
    faint: c.textFaint,
    primary: c.primary,
    onPrimary: c.textOnPrimary,
    danger: c.danger,
  };
  const resolved: TextStyle = {
    ...fonts[variant],
    color: color ?? toneColor[tone],
    ...(center ? {textAlign: 'center'} : null),
  };
  return (
    <RNText style={[resolved, style]} {...rest}>
      {children}
    </RNText>
  );
};

export default Txt;
