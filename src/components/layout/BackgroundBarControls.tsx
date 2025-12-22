"use client";

import React, { useState, useCallback } from "react";
import { MainBackgroundBar } from "./MainBackgroundBar";
import { useThemeContext } from "@/components/theme/ThemeProvider";
import { cn } from "@/lib/utils";

interface BackgroundBarControlsProps {
  onVariantChange?: (variant: "gradient" | "solid" | "text") => void;
  onHeightChange?: (height: "sm" | "md" | "lg") => void;
  currentVariant?: "gradient" | "solid" | "text";
  currentHeight?: "sm" | "md" | "lg";
  className?: string;
}

export function BackgroundBarControls({
  onVariantChange,
  onHeightChange,
  currentVariant = "gradient",
  currentHeight = "md",
  className,
}: BackgroundBarControlsProps) {
  const { isDark, theme } = useThemeContext();
  const [variant, setVariant] = useState<"gradient" | "solid" | "text">(
    currentVariant,
  );
  const [height, setHeight] = useState<"sm" | "md" | "lg">(currentHeight);

  const handleVariantChange = useCallback(
    (newVariant: "gradient" | "solid" | "text") => {
      setVariant(newVariant);
      onVariantChange?.(newVariant);
    },
    [onVariantChange],
  );

  const handleHeightChange = useCallback(
    (newHeight: "sm" | "md" | "lg") => {
      setHeight(newHeight);
      onHeightChange?.(newHeight);
    },
    [onHeightChange],
  );

  return (
    <div className={cn("flex items-center gap-2 md:gap-4", className)}>
      {/* Variant Controls */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "text-xs md:text-sm font-medium",
            isDark ? "text-gray-300" : "text-gray-700",
          )}
        >
          Style:
        </span>
        <div className="flex gap-1">
          {(["gradient", "solid", "text"] as const).map((option) => (
            <button
              key={option}
              onClick={() => handleVariantChange(option)}
              className={cn(
                "px-2 py-1 text-xs md:text-sm rounded-md transition-all duration-200",
                variant === option
                  ? isDark
                    ? "bg-blue-600 text-white"
                    : "bg-blue-500 text-white"
                  : isDark
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300",
              )}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Height Controls */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "text-xs md:text-sm font-medium",
            isDark ? "text-gray-300" : "text-gray-700",
          )}
        >
          Height:
        </span>
        <div className="flex gap-1">
          {(["sm", "md", "lg"] as const).map((option) => (
            <button
              key={option}
              onClick={() => handleHeightChange(option)}
              className={cn(
                "px-2 py-1 text-xs md:text-sm rounded-md transition-all duration-200",
                height === option
                  ? isDark
                    ? "bg-purple-600 text-white"
                    : "bg-purple-500 text-white"
                  : isDark
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300",
              )}
            >
              {option.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="flex items-center gap-2 ml-auto">
        <span
          className={cn(
            "text-xs md:text-sm font-medium",
            isDark ? "text-gray-300" : "text-gray-700",
          )}
        >
          Preview:
        </span>
        <div className="w-20 h-4 rounded-sm overflow-hidden border border-gray-300">
          <MainBackgroundBar
            variant={variant}
            height="sm"
            className="!h-4 !fixed"
          />
        </div>
      </div>
    </div>
  );
}

export default BackgroundBarControls;
