import { useState, useEffect, useMemo } from "react";
import { useTheme } from "next-themes";

interface ThemeAwareStyles {
  mounted: boolean;
  theme: string | undefined;
  sidebarBackground: string;
  sidebarBorder: string;
  backgroundImage: string;
  glassOverlay: string;
}

interface UseThemeAwareStylesReturn extends ThemeAwareStyles {
  getItemBackground: (
    isActive: boolean,
    isHovered: boolean,
    gradient: string,
  ) => string;
  getItemBorder: (isActive: boolean, isHovered: boolean) => string;
  getItemTextColor: (isActive: boolean, isHovered: boolean) => string;
}

/**
 * Custom hook to handle theme-aware styling calculations and memoized style objects
 */
export function useThemeAwareStyles(): UseThemeAwareStylesReturn {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch and stabilize during hot reload
  useEffect(() => {
    const timer = setTimeout(() => {
      requestAnimationFrame(() => setMounted(true));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Memoize theme-aware styles to prevent unnecessary recalculations
  const styles = useMemo(
    (): ThemeAwareStyles => ({
      mounted,
      theme,
      sidebarBackground:
        mounted && theme === "dark"
          ? `linear-gradient(160deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)`
          : `linear-gradient(160deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)`,
      sidebarBorder:
        mounted && theme === "dark"
          ? "1px solid rgba(255, 255, 255, 0.1)"
          : "1px solid rgba(0, 0, 0, 0.1)",
      backgroundImage:
        mounted && theme === "dark"
          ? `radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 20%),
         radial-gradient(circle at 90% 80%, rgba(168, 85, 247, 0.1) 0%, transparent 20%),
         linear-gradient(rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.03))`
          : `radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 20%),
         radial-gradient(circle at 90% 80%, rgba(168, 85, 247, 0.05) 0%, transparent 20%),
         linear-gradient(rgba(0, 0, 0, 0.02), rgba(0, 0, 0, 0.02))`,
      glassOverlay:
        mounted && theme === "dark"
          ? "linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.4))"
          : "linear-gradient(to bottom, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.5))",
    }),
    [mounted, theme],
  );

  // Memoized style calculation functions
  const getItemBackground = useMemo(
    () =>
      (isActive: boolean, isHovered: boolean, gradient: string): string => {
        if (isActive || isHovered) {
          return mounted && theme === "dark"
            ? `linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%), linear-gradient(to right, ${gradient})`
            : `linear-gradient(135deg, rgba(226, 232, 240, 0.8) 0%, rgba(241, 245, 249, 0.9) 100%), linear-gradient(to right, ${gradient})`;
        }
        return mounted && theme === "dark"
          ? "rgba(255, 255, 255, 0.03)"
          : "rgba(0, 0, 0, 0.02)";
      },
    [mounted, theme],
  );

  const getItemBorder = useMemo(
    () =>
      (isActive: boolean, isHovered: boolean): string => {
        if (isActive || isHovered) {
          return mounted && theme === "dark"
            ? "1px solid rgba(255, 255, 255, 0.2)"
            : "1px solid rgba(59, 130, 246, 0.3)";
        }
        return mounted && theme === "dark"
          ? "1px solid rgba(255, 255, 255, 0.1)"
          : "1px solid rgba(0, 0, 0, 0.1)";
      },
    [mounted, theme],
  );

  const getItemTextColor = useMemo(
    () =>
      (isActive: boolean, isHovered: boolean): string => {
        if (isActive || isHovered) {
          return mounted && theme === "dark" ? "text-white" : "text-gray-900";
        }
        return mounted && theme === "dark"
          ? "text-blue-100 hover:text-white"
          : "text-gray-700 hover:text-gray-900";
      },
    [mounted, theme],
  );

  return {
    ...styles,
    getItemBackground,
    getItemBorder,
    getItemTextColor,
  };
}
