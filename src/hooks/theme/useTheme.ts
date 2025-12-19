// Theme management hook for dark/light mode support

import { useState, useEffect, useCallback } from 'react';
import { useEnhancedState } from '@/lib/core/StateManager';
import { localStorageAdapter } from '@/lib/core/StateManager';
import type { ThemeConfig } from '@/types/search';

interface UseThemeResult {
  theme: ThemeConfig;
  setTheme: (theme: Partial<ThemeConfig>) => void;
  toggleMode: () => void;
  isDark: boolean;
  isLight: boolean;
  isAuto: boolean;
  isSystemDark: boolean;
}

const THEME_STORAGE_KEY = 'app-theme';

// Default theme configuration
const defaultTheme: ThemeConfig = {
  mode: 'auto',
  animations: true,
  transitions: true
};

export function useTheme(): UseThemeResult {
  // Persistent theme state
  const [theme, setThemeState] = useEnhancedState<ThemeConfig>(
    defaultTheme,
    {
      key: THEME_STORAGE_KEY,
      storage: localStorageAdapter,
      persist: true,
      validate: (theme: ThemeConfig) => {
        return (
          ['light', 'dark', 'auto'].includes(theme.mode) &&
          typeof theme.animations === 'boolean' &&
          typeof theme.transitions === 'boolean'
        );
      }
    }
  );

  // System theme detection
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
    // Initialize with current system preference
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // Detect system theme preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Determine if current theme is dark
  const isDark = theme.mode === 'dark' ||
    (theme.mode === 'auto' && systemTheme === 'dark');

  const isLight = theme.mode === 'light' ||
    (theme.mode === 'auto' && systemTheme === 'light');

  const isAuto = theme.mode === 'auto';

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;

    // Set theme attribute for CSS variables
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');

    // Apply CSS classes
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }

    // Handle animations and transitions
    if (!theme.animations) {
      root.style.setProperty('--animation-duration', '0ms');
      root.style.setProperty('--transition-duration', '0ms');
    } else {
      root.style.removeProperty('--animation-duration');
      root.style.removeProperty('--transition-duration');
    }

    if (!theme.transitions) {
      root.style.setProperty('--transition-duration', '0ms');
    }

  }, [isDark, theme.animations, theme.transitions]);

  // Enhanced setTheme function
  const setTheme = useCallback((updates: Partial<ThemeConfig>) => {
    setThemeState(prev => ({ ...prev, ...updates }));
  }, [setThemeState]);

  // Toggle between light/dark modes
  const toggleMode = useCallback(() => {
    setTheme({
      mode: theme.mode === 'light' ? 'dark' : 'light'
    });
  }, [theme.mode, setTheme]);

  return {
    theme,
    setTheme,
    toggleMode,
    isDark,
    isLight,
    isAuto,
    isSystemDark: systemTheme === 'dark'
  };
}

export default useTheme;
