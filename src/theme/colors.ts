/**
 * Color system for NutriLife. Two fully-specified palettes (light/dark) sharing
 * the same shape so components can theme purely off the `Theme` object.
 */

export type ThemeName = 'light' | 'dark';

export interface Theme {
  name: ThemeName;
  // Surfaces
  bg: string; // app background
  bgElevated: string; // cards / sheets
  bgSunken: string; // inputs / track backgrounds
  border: string;
  overlay: string;
  // Text
  text: string;
  textMuted: string;
  textFaint: string;
  textOnPrimary: string;
  // Brand
  primary: string;
  primaryDark: string;
  primarySoft: string; // translucent tint for chips/backgrounds
  accent: string;
  accentSoft: string;
  // Macros (carbs / protein / fat) + semantic
  carbs: string;
  protein: string;
  fat: string;
  water: string;
  calories: string;
  success: string;
  warning: string;
  danger: string;
  // Misc
  shadow: string;
  // Gradients (pairs)
  gradientPrimary: [string, string];
  gradientWater: [string, string];
  gradientCalm: [string, string];
  gradientSunrise: [string, string];
}

export const lightTheme: Theme = {
  name: 'light',
  bg: '#F5F7F6',
  bgElevated: '#FFFFFF',
  bgSunken: '#ECEFEE',
  border: '#E2E7E5',
  overlay: 'rgba(17,24,22,0.45)',

  text: '#11201B',
  textMuted: '#5A6B65',
  textFaint: '#94A29C',
  textOnPrimary: '#FFFFFF',

  primary: '#16A571',
  primaryDark: '#0E7C54',
  primarySoft: 'rgba(22,165,113,0.12)',
  accent: '#FF7A59',
  accentSoft: 'rgba(255,122,89,0.14)',

  carbs: '#F4A92C',
  protein: '#3D7BFF',
  fat: '#FF6B8B',
  water: '#3AB7E8',
  calories: '#16A571',
  success: '#16A571',
  warning: '#E8A33A',
  danger: '#E5484D',

  shadow: '#1B2B26',
  gradientPrimary: ['#1ECB8A', '#0E7C54'],
  gradientWater: ['#56CCF2', '#2D9CDB'],
  gradientCalm: ['#7F7FD5', '#86A8E7'],
  gradientSunrise: ['#FFB75E', '#FF7A59'],
};

export const darkTheme: Theme = {
  name: 'dark',
  bg: '#0C100E',
  bgElevated: '#161C19',
  bgSunken: '#1F2723',
  border: '#28322D',
  overlay: 'rgba(0,0,0,0.6)',

  text: '#ECF2EF',
  textMuted: '#9DABA5',
  textFaint: '#6B7872',
  textOnPrimary: '#04130D',

  primary: '#23D196',
  primaryDark: '#16A571',
  primarySoft: 'rgba(35,209,150,0.16)',
  accent: '#FF8C6B',
  accentSoft: 'rgba(255,140,107,0.18)',

  carbs: '#F7B84B',
  protein: '#6098FF',
  fat: '#FF8099',
  water: '#4FC3F7',
  calories: '#23D196',
  success: '#23D196',
  warning: '#F0B450',
  danger: '#FF6166',

  shadow: '#000000',
  gradientPrimary: ['#23D196', '#0E7C54'],
  gradientWater: ['#4FC3F7', '#2D7FB8'],
  gradientCalm: ['#8E8EE0', '#6A8BD8'],
  gradientSunrise: ['#FFB75E', '#FF7A59'],
};

export const themes: Record<ThemeName, Theme> = {
  light: lightTheme,
  dark: darkTheme,
};
