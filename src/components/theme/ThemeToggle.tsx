// Theme toggle button component

"use client";

import React from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useThemeContext } from "./ThemeProvider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  variant?: "button" | "icon" | "minimal";
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ThemeToggle({
  className,
  variant = "button",
  showLabel = false,
  size = "md",
}: ThemeToggleProps) {
  const { theme, toggleMode, isDark, isLight, isAuto } = useThemeContext();

  // Size configurations
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  // Get current icon and label
  const getCurrentIcon = () => {
    if (isAuto) return <Monitor className={iconSizes[size]} />;
    if (isDark) return <Moon className={iconSizes[size]} />;
    return <Sun className={iconSizes[size]} />;
  };

  const getCurrentLabel = () => {
    if (isAuto) return "Auto";
    if (isDark) return "Dark";
    return "Light";
  };

  const getNextLabel = () => {
    if (isAuto) return "Light";
    if (isDark) return "Auto";
    return "Dark";
  };

  // Button variant
  if (variant === "button") {
    return (
      <button
        onClick={toggleMode}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300",
          "bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900",
          "dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300 dark:hover:text-gray-100",
          "transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          className,
        )}
        title={`Switch to ${getNextLabel().toLowerCase()} mode`}
      >
        {getCurrentIcon()}
        {showLabel && (
          <span className="text-sm font-medium">{getCurrentLabel()}</span>
        )}
      </button>
    );
  }

  // Icon variant (minimal)
  if (variant === "minimal") {
    return (
      <button
        onClick={toggleMode}
        className={cn(
          "inline-flex items-center justify-center rounded-full border border-gray-300",
          "bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900",
          "dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300 dark:hover:text-gray-100",
          "transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          sizeClasses[size],
          className,
        )}
        title={`Switch to ${getNextLabel().toLowerCase()} mode`}
      >
        {getCurrentIcon()}
      </button>
    );
  }

  // Icon variant with tooltip
  return (
    <div className={cn("relative group", className)}>
      <button
        onClick={toggleMode}
        className={cn(
          "inline-flex items-center justify-center rounded-md p-2",
          "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
          "dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800",
          "transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          className,
        )}
        title={`Switch to ${getNextLabel().toLowerCase()} mode`}
      >
        {getCurrentIcon()}
      </button>

      {/* Tooltip */}
      <div
        className={cn(
          "absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1",
          "bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100",
          "transition-opacity duration-200 pointer-events-none whitespace-nowrap",
          "dark:bg-gray-100 dark:text-gray-900",
        )}
      >
        {getCurrentLabel()} Mode
        <div
          className={cn(
            "absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent",
            "border-t-gray-900 dark:border-t-gray-100",
          )}
        />
      </div>
    </div>
  );
}

// Theme indicator component (shows current mode without toggle)
export function ThemeIndicator({
  className,
  showLabel = false,
  size = "md",
}: Omit<ThemeToggleProps, "variant">) {
  const { isDark, isLight, isAuto } = useThemeContext();

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const getCurrentIcon = () => {
    if (isAuto) return <Monitor className={sizeClasses[size]} />;
    if (isDark) return <Moon className={sizeClasses[size]} />;
    return <Sun className={sizeClasses[size]} />;
  };

  const getCurrentLabel = () => {
    if (isAuto) return "Auto";
    if (isDark) return "Dark";
    return "Light";
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 text-gray-600 dark:text-gray-400",
        className,
      )}
    >
      {getCurrentIcon()}
      {showLabel && (
        <span className="text-sm font-medium">{getCurrentLabel()}</span>
      )}
    </div>
  );
}

export default ThemeToggle;
