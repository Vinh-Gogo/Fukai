// Theme provider component for app-wide theme management

"use client";

import React, { createContext, useContext } from "react";
import { memo, useOptimizedMemo, useOptimizedEffect } from "@/lib/performance";
import { useTheme } from "@/hooks/theme/useTheme";
import type { ThemeContextValue } from "@/types/search";

// Create theme context
const ThemeContext = createContext<ThemeContextValue | null>(null);

// Custom hook to use theme context
export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: "light" | "dark" | "auto";
}

export const ThemeProvider = memo<ThemeProviderProps>(
  ({ children, defaultTheme = "auto" }) => {
    const themeHook = useTheme();

    // Override default theme if specified - optimized with useOptimizedEffect
    useOptimizedEffect(() => {
      if (defaultTheme !== "auto" && themeHook.theme.mode === "auto") {
        themeHook.setTheme({ mode: defaultTheme });
      }
    }, [defaultTheme, themeHook.theme.mode, themeHook.setTheme]);

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useOptimizedMemo<ThemeContextValue>(
      () => ({
        theme: themeHook.theme,
        setTheme: themeHook.setTheme,
        toggleMode: themeHook.toggleMode,
        isDark: themeHook.isDark,
        isLight: themeHook.isLight,
        isAuto: themeHook.isAuto,
        isSystemDark: themeHook.isSystemDark,
      }),
      [
        themeHook.theme,
        themeHook.setTheme,
        themeHook.toggleMode,
        themeHook.isDark,
        themeHook.isLight,
        themeHook.isAuto,
        themeHook.isSystemDark,
      ],
      "theme-context-value",
    );

    return (
      <ThemeContext.Provider value={contextValue}>
        {children}
      </ThemeContext.Provider>
    );
  },
);

ThemeProvider.displayName = "ThemeProvider";

export default ThemeProvider;
