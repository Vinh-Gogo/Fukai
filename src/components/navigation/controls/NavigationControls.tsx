import React, { useCallback } from "react";
import { Menu, X } from "lucide-react";
import { useThemeStyles, useMouseTracking } from "@/hooks";
import { MobileOverlay } from "@/components/ui/MobileOverlay";
import { CollapseToggle } from "@/components/ui/CollapseToggle";

interface NavigationControlsProps {
  isVisible: boolean;
  onToggle: () => void;
  isMobile: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  collapsed: boolean;
  toggleSidebar: () => void;
}

export const NavigationControls = React.memo(
  ({
    isVisible,
    onToggle,
    isMobile,
    sidebarOpen,
    setSidebarOpen,
    collapsed,
    toggleSidebar,
  }: NavigationControlsProps) => {
    const mousePosition = useMouseTracking();
    const { mounted, getToggleButtonStyles } = useThemeStyles();

    const closeMobileSidebar = useCallback(() => {
      if (isMobile) {
        setSidebarOpen(false);
      }
    }, [isMobile, setSidebarOpen]);

    return (
      <>
        {/* Navigation Toggle Button - always visible when navigation is hidden */}
        {!isVisible && onToggle && (
          <button
            onClick={onToggle}
            className="fixed top-4 left-4 z-500 p-2.5 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 backdrop-blur-sm"
            aria-label="Show navigation menu"
            title="Show Navigation"
            style={getToggleButtonStyles()}
          >
            <Menu className="w-6 h-6 text-white drop-shadow-lg" />
          </button>
        )}

        {/* Mobile sidebar overlay - only visible on mobile when open */}
        <MobileOverlay
          isOpen={isMobile && sidebarOpen}
          mousePosition={mousePosition}
          onClose={closeMobileSidebar}
        />

        {/* External Collapse Toggle Button - Desktop Only */}
        {!isMobile && mounted && (
          <CollapseToggle collapsed={collapsed} onClick={toggleSidebar} />
        )}

        {/* Mobile Hamburger Menu Button - upgraded design */}
        {isMobile && mounted && (
          <button
            onClick={toggleSidebar}
            className="fixed top-4 left-4 z-50 p-2.5 rounded-xl shadow-lg lg:hidden transition-all duration-300 hover:scale-105 backdrop-blur-sm"
            aria-label={sidebarOpen ? "Close menu" : "Open menu"}
            style={getToggleButtonStyles()}
          >
            {sidebarOpen ? (
              <X className="w-6 h-6 text-white drop-shadow-lg" />
            ) : (
              <Menu className="w-6 h-6 text-white drop-shadow-lg" />
            )}
          </button>
        )}
      </>
    );
  },
);

NavigationControls.displayName = "NavigationControls";
