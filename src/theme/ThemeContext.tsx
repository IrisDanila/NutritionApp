import React, {createContext, useContext, useEffect, useMemo, useState} from 'react';
import {storageService, ThemeMode} from '../services/storageService';

export type ThemeColors = {
  background: string;
  card: string;
  text: string;
  mutedText: string;
  border: string;
  primary: string;
  accent: string;
  surface: string;
  info: string;
};

type ThemeContextValue = {
  isDark: boolean;
  mode: ThemeMode;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
};

const lightColors: ThemeColors = {
  background: '#F5F7FA',
  card: '#FFFFFF',
  text: '#333333',
  mutedText: '#666666',
  border: '#E0E0E0',
  primary: '#4CAF50',
  accent: '#FF6B6B',
  surface: '#F1F5F9',
  info: '#2196F3',
};

const darkColors: ThemeColors = {
  background: '#0F1115',
  card: '#1B1F2A',
  text: '#F4F6FB',
  mutedText: '#A5B0C3',
  border: '#2A3140',
  primary: '#4CAF50',
  accent: '#FF6B6B',
  surface: '#242B3A',
  info: '#4FC3F7',
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider = ({children}: {children: React.ReactNode}) => {
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    const load = async () => {
      const stored = await storageService.getThemePreference();
      setMode(stored);
    };
    load();
  }, []);

  const setThemeMode = async (next: ThemeMode) => {
    setMode(next);
    await storageService.setThemePreference(next);
  };

  const toggleTheme = async () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    await setThemeMode(next);
  };

  const value = useMemo<ThemeContextValue>(() => {
    const isDark = mode === 'dark';
    return {
      isDark,
      mode,
      colors: isDark ? darkColors : lightColors,
      setThemeMode,
      toggleTheme,
    };
  }, [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
};
