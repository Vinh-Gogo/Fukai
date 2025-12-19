"use client";

import React, { useEffect, useRef, useState } from 'react';
import { MainBackgroundBar } from './MainBackgroundBar';
import { useBackgroundBar } from '@/hooks/layout';
import { useThemeContext } from '@/components/theme/ThemeProvider';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';

interface BackgroundBarPopupProps {
  isOpen: boolean;
  onClose: () => void;
  buttonRef: React.RefObject<HTMLDivElement | null>;
}

export function BackgroundBarPopup({ isOpen, onClose, buttonRef }: BackgroundBarPopupProps) {
  const { config, setVariant, setHeight, toggleBackgroundBar } = useBackgroundBar();
  const { isDark } = useThemeContext();
  const popupRef = useRef<HTMLDivElement>(null);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});

  // Calculate popup position when buttonRef changes
  useEffect(() => {
    const updatePopupStyle = () => {
      if (!buttonRef.current || !isOpen) {
        setPopupStyle({});
        return;
      }

      const buttonRect = buttonRef.current.getBoundingClientRect();
      const popupWidth = 300;
      const popupHeight = 300;

      // Position to the right of the button, aligning tops
      let left = buttonRect.right + 8; // 8px gap
      let top = buttonRect.top;

      // Ensure popup doesn't go off screen
      if (left + popupWidth > window.innerWidth) {
        left = buttonRect.left - popupWidth - 8; // Position to the left instead
      }

      if (top + popupHeight > window.innerHeight) {
        top = window.innerHeight - popupHeight - 8; // Adjust from bottom
      }

      setPopupStyle({
        position: 'fixed' as const,
        left: `${left}px`,
        top: `${top}px`,
        width: `${popupWidth}px`,
        height: `${popupHeight}px`,
        zIndex: 9999,
      });
    };

    updatePopupStyle();
    window.addEventListener('resize', updatePopupStyle);
    return () => window.removeEventListener('resize', updatePopupStyle);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Background Bar - Only show when enabled */}
      {config.showBackgroundBar && (
        <MainBackgroundBar
          variant={config.variant}
          position={config.position}
          height={config.height}
        />
      )}

      {/* Glass-morphism Popup */}
      <div
        ref={popupRef}
        style={popupStyle}
        className={cn(
          // Glass-morphism effect with 10% BrandHeader blend
          "rounded-xl shadow-2xl backdrop-blur-md",
          // Transparent background that blends with BrandHeader gradient
          isDark
            ? "bg-black/10 border border-white/20"
            : "bg-white/10 border border-gray-300/30",
          // Subtle gradient overlay to match BrandHeader
          "before:absolute before:inset-0 before:rounded-xl before:opacity-10 before:bg-gradient-to-br",
          isDark
            ? "before:from-blue-600 before:via-purple-600 before:to-blue-700"
            : "before:from-blue-500 before:via-purple-500 before:to-blue-600"
        )}
      >
        {/* Content with proper contrast */}
        <div className="relative z-10 p-4 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Background Bar Settings
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          </div>

          {/* Master Toggle */}
          <div className="mb-4">
            <button
                onClick={toggleBackgroundBar}
                className={cn(
                  "w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  config.showBackgroundBar
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : isDark
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                )}
            >
              {config.showBackgroundBar ? (
                <>
                  <Eye className="w-4 h-4" />
                  Background Bar ON
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4" />
                  Background Bar OFF
                </>
              )}
            </button>
          </div>

          {/* Style Controls */}
          <div className="mb-3">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2 block">
              Style
            </label>
            <div className="grid grid-cols-3 gap-1">
              {(['gradient', 'solid', 'text'] as const).map((variant) => (
                <button
                    key={variant}
                    onClick={() => setVariant(variant)}
                    className={cn(
                      "px-2 py-1 text-xs rounded-md transition-all",
                      config.variant === variant
                        ? "bg-blue-500 text-white"
                        : isDark
                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    )}
                >
                  {variant.charAt(0).toUpperCase() + variant.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Height Controls */}
          <div className="mb-3">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2 block">
              Height
            </label>
            <div className="grid grid-cols-3 gap-1">
              {(['sm', 'md', 'lg'] as const).map((height) => (
                <button
                    key={height}
                    onClick={() => setHeight(height)}
                    className={cn(
                      "px-2 py-1 text-xs rounded-md transition-all",
                      config.height === height
                        ? "bg-purple-500 text-white"
                        : isDark
                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    )}
                >
                  {height.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="mt-auto">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2 block">
              Preview
            </label>
            <div className="w-full h-8 rounded-sm overflow-hidden border border-gray-300 dark:border-gray-600">
              <div
                className={cn(
                  "h-full w-full",
                  config.variant === 'gradient'
                    ? isDark
                      ? 'bg-gradient-to-r from-blue-800 via-purple-800 to-blue-900'
                      : 'bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700'
                    : config.variant === 'solid'
                      ? isDark
                        ? 'bg-gray-900 border-b border-gray-800'
                        : 'bg-blue-600 border-b border-blue-700'
                      : isDark
                        ? 'bg-gray-950 text-blue-200'
                        : 'bg-white text-blue-600'
                )}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default BackgroundBarPopup;
