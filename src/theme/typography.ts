import {TextStyle} from 'react-native';

/** Shared spacing scale (4pt grid). */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

type FontKey =
  | 'displayLg'
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bodyLg'
  | 'body'
  | 'label'
  | 'caption'
  | 'mono';

export const fonts: Record<FontKey, TextStyle> = {
  displayLg: {fontSize: 40, fontWeight: '800', letterSpacing: -0.5},
  display: {fontSize: 32, fontWeight: '800', letterSpacing: -0.4},
  h1: {fontSize: 26, fontWeight: '700', letterSpacing: -0.3},
  h2: {fontSize: 21, fontWeight: '700', letterSpacing: -0.2},
  h3: {fontSize: 17, fontWeight: '700'},
  bodyLg: {fontSize: 17, fontWeight: '500'},
  body: {fontSize: 15, fontWeight: '500'},
  label: {fontSize: 13, fontWeight: '600', letterSpacing: 0.2},
  caption: {fontSize: 12, fontWeight: '600', letterSpacing: 0.3},
  mono: {fontSize: 14, fontWeight: '600'},
};
