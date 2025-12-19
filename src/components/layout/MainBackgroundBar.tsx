"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { useThemeContext } from '@/components/theme/ThemeProvider';

interface MainBackgroundBarProps {
  variant?: 'gradient' | 'solid' | 'text';
  position?: 'top' | 'bottom';
  height?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

export function MainBackgroundBar({
  variant = 'gradient',
  position = 'top',
  height = 'md',
  className,
  children
}: MainBackgroundBarProps) {
  const { isDark, theme } = useThemeContext();

  // Height classes
  const heightClasses = {
    sm: 'h-8 md:h-12',
    md: 'h-12 md:h-16',
    lg: 'h-16 md:h-20'
  };

  // Position classes
  const positionClasses = {
    top: 'top-0',
    bottom: 'bottom-0'
  };

  // Color schemes compatible with BrandHeader
  const getColorClasses = () => {
    switch (variant) {
      case 'gradient':
        // Matches BrandHeader gradient: blue-600 via-purple-600 to-blue-700
        return isDark 
          ? 'bg-gradient-to-r from-blue-800 via-purple-800 to-blue-900'
          : 'bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700';
      
      case 'solid':
        return isDark 
          ? 'bg-gray-900 border-b border-gray-800'
          : 'bg-blue-600 border-b border-blue-700';
      
      case 'text':
        // Matches text colors from BrandHeader
        return isDark 
          ? 'bg-gray-950 text-blue-200'
          : 'bg-white text-blue-600';
      
      default:
        return isDark 
          ? 'bg-gradient-to-r from-blue-800 via-purple-800 to-blue-900'
          : 'bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700';
    }
  };

  // Pattern overlay for gradient variant
  const renderPatternOverlay = () => {
    if (variant !== 'gradient') return null;
    
    return (
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
      </div>
    );
  };

  // Wave separator for top position
  const renderWaveSeparator = () => {
    if (position !== 'top') return null;
    
    return (
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className={cn(
            "w-full h-8 md:h-12",
            variant === 'text' 
              ? (isDark ? 'fill-gray-950' : 'fill-white')
              : (isDark ? 'fill-gray-900' : 'fill-gray-50')
          )}
        >
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
        </svg>
      </div>
    );
  };

  return (
    <div 
      className={cn(
        // Base positioning
        'left-0 right-0 z-50 w-full',
        // Height and position
        heightClasses[height],
        positionClasses[position],
        // Colors and effects
        getColorClasses(),
        // Transitions
        theme.transitions && 'transition-all duration-300 ease-in-out',
        // Additional classes
        className
      )}
      role="banner"
      aria-label="Main background bar"
    >
      {/* Pattern overlay for gradient */}
      {renderPatternOverlay()}
      
      {/* Content container */}
      <div className="relative h-full flex items-center justify-center px-4 md:px-8">
        {children && (
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            {children}
          </div>
        )}
      </div>

      {/* Wave separator */}
      {renderWaveSeparator()}
    </div>
  );
}

export default MainBackgroundBar;
