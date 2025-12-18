"use client";

import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandHeaderMini } from "./BrandHeaderMini";
import { NavigationSection } from "./NavigationSection";
import { NavigationControls } from "./NavigationControls";
import { AIAgentStatus } from "../ui";
import { useNavigationState } from "@/hooks/useNavigationState";
import { useMouseInteraction } from "@/hooks/useMouseInteraction";
import { useParticleEffects } from "@/hooks/useParticleEffects";
import { useThemeAwareStyles } from "@/hooks/useThemeAwareStyles";
import { navigationItems, toolItems } from "@/config/navigation.config";

export function Navigation({ isVisible = true, onToggle }: { isVisible?: boolean; onToggle?: () => void }) {
  const pathname = usePathname();

  // Custom hooks for state management
  const {
    sidebarOpen,
    setSidebarOpen,
    collapsed,
    setCollapsed,
    isMobile,
    toggleSidebar,
    closeMobileSidebar,
  } = useNavigationState();

  const { mousePosition, activeGradient, setActiveGradient } = useMouseInteraction();
  const { particleStyles } = useParticleEffects();
  const {
    mounted,
    theme,
    sidebarBackground,
    sidebarBorder,
    backgroundImage,
    glassOverlay,
    getItemBackground,
    getItemBorder,
    getItemTextColor,
  } = useThemeAwareStyles();

  return (
    <>
      <NavigationControls
        isVisible={isVisible}
        onToggle={onToggle || (() => {})}
        isMobile={isMobile}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        collapsed={collapsed}
        toggleSidebar={toggleSidebar}
      />

      {/* Sidebar - Enhanced modern design with glassmorphism */}
      <aside
        className={cn(
          "mr-2 flex flex-col transition-all duration-320 shadow-xl flex-shrink-0 rounded-3xl overflow-hidden border border-white/10",
          // Normal positioning for natural scrolling
          "h-screen",
          // Mobile behavior
          isMobile
            ? sidebarOpen
              ? "w-72 translate-x-0"
              : "-translate-x-full"
            : "",
          // Desktop behavior - collapsed width doubled for better space
          !isMobile && collapsed ? "w-20" : "w-64",
          "block"
        )}
        style={{
          background: "linear-gradient(160deg, rgba(25, 25, 35, 0.92) 0%, rgba(35, 35, 50, 0.88) 100%)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* 1. Fixed Top Section: Brand Header Mini with enhanced design */}
        <div className="flex-shrink-0 px-3 py-2 pt-1 pb-0">
          <BrandHeaderMini isCollapsed={collapsed} />
        </div>

        {/* 2. Scrollable Middle Section: Main Functions + System Tools with modern styling */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          <NavigationSection
            navigationItems={navigationItems}
            toolItems={toolItems}
            collapsed={collapsed}
          />
        </div>

        {/* 3. Fixed Bottom Section: AI Agent with enhanced styling */}
        <div className="flex-shrink-0 px-3 py-2 border-t border-white/10 mt-1">
          <AIAgentStatus collapsed={collapsed} />
        </div>
      </aside>

      <style jsx global>{`
        @keyframes gradientShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes pulse {
          0% {
            opacity: 1;
            transform: scale(1.05);
          }
          50% {
            opacity: 0.8;
            transform: scale(1);
          }
          100% {
            opacity: 1;
            transform: scale(1.05);
          }
        }

        @keyframes float {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0.2;
          }
          50% {
            transform: translateY(-10px) translateX(5px);
            opacity: 0.3;
          }
          100% {
            transform: translateY(0) translateX(0);
            opacity: 0.2;
          }
        }

        @keyframes gradient-shift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }

        .animate-float {
          animation: float 15s ease-in-out infinite;
        }

        .animate-gradient-shift {
          animation: gradient-shift 8s ease infinite;
        }

        .animate-shimmer {
          animation: shimmer 2.5s infinite linear;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          background-size: 200% 100%;
        }

        /* Enhanced navigation item styling */
        .nav-item {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 12px;
          position: relative;
          overflow: hidden;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateX(2px);
        }

        .nav-item.active {
          background: rgba(139, 92, 246, 0.15);
          border-left: 3px solid #8b5cf6;
          box-shadow: 0 4px 6px -1px rgba(139, 92, 246, 0.1);
        }

        .nav-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #8b5cf6, #ec4899);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .nav-item:hover::before,
        .nav-item.active::before {
          opacity: 1;
        }

        /* Enhanced sidebar scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #8b5cf6, #ec4899);
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #7c3aed, #f43f5e);
        }

        /* Mobile backdrop enhancement */
        @media (max-width: 768px) {
          .mobile-backdrop {
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
            animation: fadeIn 0.2s ease;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        }
      `}</style>
    </>
  );
}
