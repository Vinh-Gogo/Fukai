import React from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useThemeContext } from "../theme/ThemeProvider";
import { cn } from "@/lib/utils";

// Constants for particle effects
const PARTICLE_CONFIG = {
  sizes: [2, 4, 6, 3, 5],
  tops: [10, 30, 50, 20, 70],
  lefts: [15, 45, 75, 25, 85],
  durations: [2, 2.5, 3, 2.2, 2.8],
} as const;

// Qwen's signature gradient colors
const QWEN_GRADIENTS = {
  light: "bg-gradient-to-r from-emerald-500 to-teal-600",
  dark: "bg-gradient-to-r from-emerald-900/80 to-teal-900/80",
} as const;

// Floating particles component
const FloatingParticles = React.memo(() => (
  <div className="absolute inset-0 pointer-events-none">
    {PARTICLE_CONFIG.sizes.map((size, i) => (
      <div
        key={i}
        className="absolute rounded-full bg-emerald-400/20 animate-pulse"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          top: `${PARTICLE_CONFIG.tops[i]}%`,
          left: `${PARTICLE_CONFIG.lefts[i]}%`,
          animationDelay: `${i * 0.2}s`,
          animationDuration: `${PARTICLE_CONFIG.durations[i]}s`,
        }}
      />
    ))}
  </div>
));

FloatingParticles.displayName = "FloatingParticles";

interface AIAgentStatusProps {
  collapsed: boolean;
}

export const AIAgentStatus = React.memo(({ collapsed }: AIAgentStatusProps) => {
  const { toggleMode, isDark, isAuto } = useThemeContext();

  // Get current theme icon with Qwen colors
  const getCurrentIcon = React.useCallback(() => {
    if (isAuto) return <Monitor className="w-4 h-4 text-emerald-200" />;
    if (isDark) return <Moon className="w-4 h-4 text-emerald-200" />;
    return <Sun className="w-4 h-4 text-emerald-600" />;
  }, [isAuto, isDark]);

  const getNextLabel = React.useCallback(() => {
    if (isAuto) return "Light";
    if (isDark) return "Auto";
    return "Dark";
  }, [isAuto, isDark]);

  if (collapsed) {
    return (
      <div className="p-1 flex justify-center">
        <div
          className={cn(
            "w-8 h-8 flex items-center justify-center transition-all duration-300",
            "bg-gradient-to-r from-emerald-500 to-teal-600 shadow-[0_0_12px_rgba(52,211,153,0.4)]",
            "hover:shadow-[0_0_15px_rgba(52,211,153,0.6)] hover:scale-105",
          )}
        >
          <span className="text-white text-sm font-bold tracking-tight">Q</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "p-1 transition-all duration-300",
        isDark
          ? `${QWEN_GRADIENTS.dark} shadow-[0_4px_20px_rgba(0,0,0,0.3)]`
          : `${QWEN_GRADIENTS.light} shadow-[0_4px_20px_rgba(0,45,30,0.25)]`,
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3 p-2 rounded-lg transition-all duration-300 relative overflow-hidden",
          isDark
            ? "bg-gray-900/70 backdrop-blur-sm"
            : "bg-gray-50/80 backdrop-blur-sm",
        )}
      >
        {/* Dynamic gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-600/10 opacity-50"></div>

        {/* Floating particles effect */}
        <FloatingParticles />

        {/* AI Agent badge with pulse animation */}
        <div className="relative z-10 flex items-center gap-2">
          <div
            className={cn(
              "relative w-8 h-8 rounded-full flex items-center justify-center",
              "shadow-[0_0_15px_rgba(52,211,153,0.5)] animate-pulse-slow",
            )}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 opacity-75 animate-ping"></div>
            <div className="relative w-7 h-7 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold tracking-tight">
                Q
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div
              className={cn(
                "text-sm font-semibold transition-colors duration-300",
                isDark ? "text-emerald-300" : "text-emerald-800",
              )}
            >
              Vinh-GoGo
            </div>
            <div
              className={cn(
                "text-xs font-medium transition-colors duration-300",
                isDark ? "text-emerald-400/80" : "text-emerald-700/80",
              )}
            >
              Engineer. 234th Themes Ultra.
            </div>
          </div>
        </div>

        {/* Enhanced theme toggle with Qwen styling */}
        <div className="relative z-10">
          <button
            onClick={toggleMode}
            className={cn(
              "inline-flex items-center justify-center rounded-full transition-all duration-300",
              "w-10 h-10 focus:outline-none focus:ring-2 focus:ring-emerald-400/50",
              isDark
                ? "bg-gray-800/80 hover:bg-gray-700 border border-emerald-400/20 shadow-[0_0_8px_rgba(52,211,153,0.2)]"
                : "bg-white/90 hover:bg-white border border-emerald-500/30 shadow-[0_0_8px_rgba(0,45,30,0.15)]",
            )}
            title={`Switch to ${getNextLabel().toLowerCase()} mode`}
          >
            <div
              className={cn(
                "relative transition-transform duration-300 transform hover:scale-110",
                isDark ? "text-emerald-300" : "text-emerald-600",
              )}
            >
              {getCurrentIcon()}
            </div>

            {/* Theme indicator dot */}
            <div
              className={cn(
                "absolute top-1 right-1 w-1.5 h-1.5 rounded-full transition-all duration-300",
                isAuto
                  ? "bg-blue-400 animate-pulse"
                  : isDark
                    ? "bg-emerald-400"
                    : "bg-yellow-400",
              )}
            />
          </button>
        </div>
      </div>
    </div>
  );
});

AIAgentStatus.displayName = "AIAgentStatus";
