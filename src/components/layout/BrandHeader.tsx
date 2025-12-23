"use client";

import {
  Brain,
  Search,
  Sparkles,
  Activity,
  Archive,
  Bot,
  FileText,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWaveParticles, useCoastlineEffect } from "./hooks";

// Constants
const PARTICLE_COUNT = 24;
const COASTLINE_WIDTH_MULTIPLIER = 3; // 300% of viewport width
const COASTLINE_HEIGHT = 150;
const COASTLINE_POINT_SPACING = 15;

interface BrandHeaderProps {
  icon?:
    | "brain"
    | "search"
    | "sparkles"
    | "activity"
    | "archive"
    | "bot"
    | "file-text";
  title: string;
  subtitle: string;
  statusText: string;
  showStatusIndicator?: boolean;
  className?: string;
}

const iconMap: Record<NonNullable<BrandHeaderProps["icon"]>, LucideIcon> = {
  brain: Brain,
  search: Search,
  sparkles: Sparkles,
  activity: Activity,
  archive: Archive,
  bot: Bot,
  "file-text": FileText,
} as const;

// Water gradient stops for coastline
const WATER_GRADIENT_STOPS = [
  { offset: "0%", color: "rgba(17, 80, 200, 0.9)" },
  { offset: "30%", color: "rgba(25, 100, 220, 0.8)" },
  { offset: "60%", color: "rgba(40, 140, 240, 0.7)" },
  { offset: "80%", color: "rgba(60, 180, 250, 0.5)" },
  { offset: "100%", color: "rgba(100, 220, 255, 0.3)" },
] as const;

// Foam gradient stops for inline SVG
const FOAM_GRADIENT_STOPS = [
  { offset: "0%", stopColor: "rgba(255, 255, 255, 0.9)" },
  { offset: "30%", stopColor: "rgba(255, 255, 255, 0.6)" },
  { offset: "60%", stopColor: "rgba(255, 255, 255, 0.4)" },
  { offset: "100%", stopColor: "rgba(255, 255, 255, 0.2)" },
] as const;

export default function BrandHeader({
  icon = "brain",
  title,
  subtitle,
  statusText,
  showStatusIndicator = true,
  className,
}: BrandHeaderProps) {
  const IconComponent = iconMap[icon];

  // Custom hooks for particle and coastline effects
  const waveContainerRef = useWaveParticles(PARTICLE_COUNT);
  const coastlineRef = useCoastlineEffect(
    COASTLINE_WIDTH_MULTIPLIER,
    COASTLINE_HEIGHT,
    COASTLINE_POINT_SPACING,
    WATER_GRADIENT_STOPS,
  );

  return (
    <header
      className={cn(
        "relative w-full overflow-hidden",
        "bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 text-white",
        className,
      )}
    >
      {/* Background Overlay with Animated Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-800/20 to-purple-800/20 animate-gradient-shift" />

      {/* Particle Background Effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          ref={waveContainerRef}
          className="absolute bottom-0 left-0 right-0 h-48 overflow-hidden"
        />
      </div>

      {/* Main Content Container */}
      <div className="relative px-4 md:px-8 py-12 md:py-16">
        {/* Centered Content Wrapper */}
        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Icon Container - Large Hero Icon with Glow */}
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-6 md:mb-8 shadow-2xl border border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]">
            <IconComponent className="w-8 h-8 md:w-10 md:h-10 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
          </div>

          {/* Main Title with Gradient Text */}
          <h1 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4 tracking-tight">
            <span className="block bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-200 to-white drop-shadow-lg">
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

          {/* Status Indicator with Enhanced Animation */}
          {showStatusIndicator && (
            <div className="inline-flex items-center gap-2 md:gap-3 mt-6 md:mt-8 px-4 md:px-6 py-2 md:py-3 bg-white/15 backdrop-blur-sm rounded-full border border-white/20 shadow-lg animate-float">
              <div className="flex items-center gap-1.5">
                {/* Enhanced Wave Animation */}
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-400 rounded-full animate-wave-pulse"
                      style={{
                        animationDelay: `${i * 0.15}s`,
                        transform: "scale(0.8)",
                      }}
                    />
                  ))}
                </div>
              </div>
              <span className="text-sm md:text-base font-medium text-white drop-shadow-sm">
                {statusText}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Realistic Extended Coastline Wave */}
      <div className="absolute bottom-0 left-0 right-0 h-48 md:h-56 overflow-hidden">
        <div
          ref={coastlineRef}
          className="absolute bottom-0 w-full h-full"
          style={{
            animation: "coastline-scroll 60s linear infinite",
          }}
        />

        {/* Subtle foam effect along the wave edge */}
        <div className="absolute bottom-0 w-full h-12 opacity-30">
          <svg
            viewBox="0 0 1200 120"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient
                id="foamGradient"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="rgba(255, 255, 255, 0.9)" />
                <stop offset="30%" stopColor="rgba(255, 255, 255, 0.6)" />
                <stop offset="60%" stopColor="rgba(255, 255, 255, 0.4)" />
                <stop offset="100%" stopColor="rgba(255, 255, 255, 0.2)" />
              </linearGradient>
            </defs>
            <path
              d="M0,80 C100,70 200,90 300,80 C400,70 500,90 600,80 C700,70 800,90 900,80 C1000,70 1100,90 1200,80 L1200,120 L0,120 Z"
              fill="url(#foamGradient)"
            />
          </svg>
        </div>
      </div>
    </header>
  );
}
