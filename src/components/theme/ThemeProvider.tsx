// Theme provider component for app-wide theme management

'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useTheme } from '@/hooks/theme/useTheme';
import type { ThemeContextValue } from '@/types/search';

// Create theme context
const ThemeContext = createContext<ThemeContextValue | null>(null);

// Custom hook to use theme context
export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: 'light' | 'dark' | 'auto';
}

export function ThemeProvider({
  children,
  defaultTheme = 'auto'
}: ThemeProviderProps) {
  const themeHook = useTheme();

  // Override default theme if specified
  useEffect(() => {
    if (defaultTheme !== 'auto' && themeHook.theme.mode === 'auto') {
      themeHook.setTheme({ mode: defaultTheme });
    }
  }, [defaultTheme, themeHook]);

  // Provide theme context value
  const contextValue: ThemeContextValue = {
    theme: themeHook.theme,
    setTheme: themeHook.setTheme,
    toggleMode: themeHook.toggleMode,
    isDark: themeHook.isDark,
    isLight: themeHook.isLight,
    isAuto: themeHook.isAuto,
    isSystemDark: themeHook.isSystemDark
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeProvider;
