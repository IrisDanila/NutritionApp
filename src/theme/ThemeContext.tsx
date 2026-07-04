import React, {createContext, useContext, useMemo} from 'react';
import {useColorScheme} from 'react-native';
import {Theme, themes} from './colors';
import {useAppStore} from '../store/useAppStore';
import {ThemeMode} from '../store/types';

interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  isDark: boolean;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const system = useColorScheme();
  const mode = useAppStore(s => s.settings.themeMode);
  const updateSettings = useAppStore(s => s.updateSettings);

  const value = useMemo<ThemeContextValue>(() => {
    const resolved =
      mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;
    const theme = themes[resolved];
    return {
      theme,
      mode,
      isDark: resolved === 'dark',
      setMode: m => updateSettings({themeMode: m}),
      toggle: () =>
        updateSettings({
          themeMode: resolved === 'dark' ? 'light' : 'dark',
        }),
    };
  }, [mode, system, updateSettings]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

/** Convenience hook returning just the palette. */
export function useColors(): Theme {
  return useTheme().theme;
}
