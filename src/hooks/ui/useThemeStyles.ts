import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

export function useThemeStyles() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const getSidebarStyles = () => ({
    background:
      mounted && theme === "dark"
        ? `linear-gradient(160deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)`
        : `linear-gradient(160deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)`,
    borderRight:
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
  });

  const getToggleButtonStyles = () => ({
    background:
      mounted && theme === "dark"
        ? "linear-gradient(to bottom right, rgba(37, 99, 235, 0.9), rgba(126, 34, 206, 0.9))"
        : "linear-gradient(to bottom right, rgba(59, 130, 246, 0.95), rgba(147, 51, 234, 0.95))",
    border:
      mounted && theme === "dark"
        ? "1px solid rgba(255, 255, 255, 0.2)"
        : "1px solid rgba(255, 255, 255, 0.3)",
    boxShadow:
      mounted && theme === "dark"
        ? "0 4px 20px rgba(59, 130, 246, 0.4)"
        : "0 4px 20px rgba(59, 130, 246, 0.3)",
  });

  const getCollapseButtonStyles = () => ({
    background: "white",
    border:
      mounted && theme === "dark"
        ? "1px solid rgba(255, 255, 255, 0.1)"
        : "1px solid rgba(0, 0, 0, 0.1)",
    boxShadow:
      mounted && theme === "dark"
        ? "0 4px 20px rgba(0, 0, 0, 0.3)"
        : "0 4px 20px rgba(0, 0, 0, 0.1)",
  });

  const getCollapseButtonFilter = () =>
    mounted && theme === "dark"
      ? "brightness(0) invert(1) sepia(1) saturate(5) hue-rotate(180deg) brightness(1.2)"
      : "brightness(0) saturate(1) hue-rotate(210deg)";

  return {
    mounted,
    theme,
    getSidebarStyles,
    getToggleButtonStyles,
    getCollapseButtonStyles,
    getCollapseButtonFilter,
  };
}
