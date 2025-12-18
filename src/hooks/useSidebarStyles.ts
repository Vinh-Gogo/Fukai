import { useThemeStyles } from "./useThemeStyles";

export function useSidebarStyles() {
  const { mounted, theme } = useThemeStyles();

  const getSidebarContainerStyles = () => ({
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

  return {
    getSidebarContainerStyles,
  };
}
