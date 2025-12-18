"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandHeaderProps {
  icon: LucideIcon;           // Icon component (Search, etc.)
  title: string;              // Main title ("RAG Platform")
  subtitle: string;           // Subtitle ("Web Search & AI")
  statusText: string;         // Status text ("AI Agent Online & Ready")
  showStatusIndicator?: boolean; // Show/hide status indicator (default: true)
  className?: string;         // Additional CSS classes
}

export default function BrandHeader({
  icon: Icon,
  title,
  subtitle,
  statusText,
  showStatusIndicator = true,
  className
}: BrandHeaderProps) {
  return (
    <header className={cn(
      "rounded-3xl",
      // no background
      "bg-transparent",
      // Full-width gradient background - spans entire content area width
      "relative bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 text-white",
      className
    )}>

      {/* Background Overlay with Pattern */}
      <div className="absolute inset-0 ">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
      </div>

      {/* Main Content Container */}
      <div className="relative px-4 md:px-8 py-12 md:py-16 ">

        {/* Centered Content Wrapper */}
        <div className="max-w-4xl mx-auto text-center">

          {/* Icon Container - Large Hero Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-6 md:mb-8 shadow-2xl">
            <Icon className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </div>

          {/* Main Title */}
          <h1 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4 tracking-tight">
            <span className="block text-white drop-shadow-lg">
              {title}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl font-medium text-blue-100 mb-2 md:mb-3 drop-shadow-sm">
            {subtitle}
          </p>

          {/* Description Text */}
          <p className="text-base md:text-lg text-blue-200 max-w-2xl mx-auto leading-relaxed px-4">
            AI-powered semantic search across your document knowledge base
          </p>

          {/* Status Indicator */}
          {showStatusIndicator && (
            <div className="inline-flex items-center gap-2 md:gap-3 mt-6 md:mt-8 px-4 md:px-6 py-2 md:py-3 bg-white/15 backdrop-blur-sm rounded-full border border-white/20 shadow-lg">
              <div className="w-2 h-2 md:w-3 md:h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm md:text-base font-medium">
                {statusText}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Wave Separator */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="w-full h-12 md:h-16 fill-gray-50"
        >
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
        </svg>
      </div>
    </header>
  );
}
