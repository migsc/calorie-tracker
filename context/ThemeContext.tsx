import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/colors';

type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  preference: ThemePreference;
  colorScheme: 'light' | 'dark';
  theme: typeof Colors.dark;
  isDark: boolean;
  setPreference: (p: ThemePreference) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = '@opencalorie_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme() ?? 'light';
  const [preference, setPreferenceState] = useState<ThemePreference>('light');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val === 'light' || val === 'dark' || val === 'system') {
        setPreferenceState(val);
      }
    });
  }, []);

  const setPreference = useCallback((p: ThemePreference) => {
    setPreferenceState(p);
    AsyncStorage.setItem(STORAGE_KEY, p);
  }, []);

  const toggle = useCallback(() => {
    const resolved = preference === 'system' ? systemScheme : preference;
    setPreference(resolved === 'dark' ? 'light' : 'dark');
  }, [preference, systemScheme, setPreference]);

  const colorScheme: 'light' | 'dark' =
    preference === 'system' ? systemScheme : preference;

  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const value = useMemo(
    () => ({ preference, colorScheme, theme, isDark, setPreference, toggle }),
    [preference, colorScheme, theme, isDark, setPreference, toggle]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
