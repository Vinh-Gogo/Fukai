"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Navigation width values (in Tailwind units)
export const NAVIGATION_WIDTHS = {
  collapsed: 24, // w-24 = 96px (24 * 4px)
  expanded: 66,   // w-66 = 264px (66 * 4px)
} as const;

// Mobile detection breakpoint (lg: 1024px)
export const MOBILE_BREAKPOINT = 1024;

interface NavigationContextType {
  // Mobile state
  isMobile: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  closeMobileSidebar: () => void;

  // Desktop state
  isCollapsed: boolean;
  currentWidth: number;
  toggleCollapse: () => void;
  setCollapsed: (collapsed: boolean) => void;

  // Combined toggle (responsive)
  toggleNavigation: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  children: React.ReactNode;
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  // Desktop collapse state
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection effect
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      const newIsMobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(newIsMobile);

      // Close sidebar when transitioning from mobile to desktop
      if (isMobile && !newIsMobile && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobile, sidebarOpen]);

  // Handle escape key to close mobile sidebar
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isMobile) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isMobile]);

  // Mobile sidebar functions
  const closeMobileSidebar = useCallback(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  // Unified toggle function (responsive)
  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setSidebarOpen((prev) => !prev);
    } else {
      setIsCollapsed((prev) => !prev);
    }
  }, [isMobile]);

  // Desktop collapse functions
  const toggleCollapse = useCallback(() => {
    if (!isMobile) {
      setIsCollapsed((prev) => !prev);
    }
  }, [isMobile]);

  const setCollapsed = useCallback((collapsed: boolean) => {
    if (!isMobile) {
      setIsCollapsed(collapsed);
    }
  }, [isMobile]);

  // Combined navigation toggle
  const toggleNavigation = useCallback(() => {
    if (isMobile) {
      setSidebarOpen((prev) => !prev);
    } else {
      setIsCollapsed((prev) => !prev);
    }
  }, [isMobile]);

  // Current width calculation
  const currentWidth = isCollapsed ? NAVIGATION_WIDTHS.collapsed : NAVIGATION_WIDTHS.expanded;

  const value: NavigationContextType = {
    // Mobile state
    isMobile,
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar,
    closeMobileSidebar,

    // Desktop state
    isCollapsed,
    currentWidth,
    toggleCollapse,
    setCollapsed,

    // Combined
    toggleNavigation,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigationContext() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigationContext must be used within a NavigationProvider');
  }
  return context;
}

// Utility function to get Tailwind margin class based on navigation width
export function getNavigationMarginClass(width: number): string {
  if (width === NAVIGATION_WIDTHS.collapsed) return 'lg:ml-22';
  if (width === NAVIGATION_WIDTHS.expanded) return 'lg:ml-66';
  return 'lg:ml-66'; // default to expanded
}
