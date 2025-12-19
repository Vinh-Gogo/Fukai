"use client";

import { cn } from "@/lib/utils";
import { BrandHeaderMini } from "./layout";
import { NavigationSection } from "./layout";
import { NavigationControls } from "./controls";
import { AIAgentStatus } from "../ui";
import { useNavigationState } from "@/hooks";
import { navigationItems, toolItems } from "@/config/navigation.config";

export function Navigation({ isVisible = true, onToggle }: { isVisible?: boolean; onToggle?: () => void }) {
  const {
    sidebarOpen,
    setSidebarOpen,
    collapsed,
    isMobile,
    toggleSidebar,
  } = useNavigationState();

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

      {/* Sidebar - Đồng nhất với BrandHeader */}
      <aside
        className={cn(
          "mr-2 flex flex-col transition-all duration-300 flex-shrink-0 border",
          "rounded-3xl",
          // Kích thước
          "h-screen",
          isMobile
            ? sidebarOpen
              ? "w-72 translate-x-0"
              : "-translate-x-full"
            : "",
          !isMobile && collapsed ? "w-22" : "w-66",
          "block"
        )}
        // Áp dụng cùng gradient như BrandHeader
        style={{
          background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 30%, #1d4ed8 100%)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Background overlay giống BrandHeader */}
        <div className="absolute inset-0 bg-black/10 pointer-events-none">
          <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
        </div>

        {/* Content with relative positioning */}
        <div className="relative flex flex-col h-full text-white">
          {/* 1. Brand Header Mini */}
          <div className="flex-shrink-0 p-3">
            <BrandHeaderMini isCollapsed={collapsed} />
          </div>

          {/* 2. Navigation Sections */}
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <NavigationSection
              navigationItems={navigationItems}
              toolItems={toolItems}
              collapsed={collapsed}
            />
          </div>

          {/* 3. AI Agent Status & Theme Toggle */}
          <div className="flex-shrink-0 p-4 border-t border-white/20">
            <AIAgentStatus collapsed={collapsed} />
          </div>
        </div>

        {/* Bottom wave (optional, if you want full sync) */}
        {!collapsed && (
          <div className="absolute bottom-0 left-0 right-0 z-10">
            <svg
              viewBox="0 0 1200 60"
              preserveAspectRatio="none"
              className="w-full h-3 md:h-4 fill-gray-50/20"
            >
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
            </svg>
          </div>
        )}
      </aside>
    </>
  );
}
