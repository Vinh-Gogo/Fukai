import { useState, useEffect, useCallback } from "react";

interface UseNavigationStateReturn {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
  closeMobileSidebar: () => void;
}

/**
 * Custom hook to manage navigation sidebar state, mobile detection, and keyboard navigation
 */
export function useNavigationState(): UseNavigationStateReturn {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size and handle responsive behavior
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    const handleResize = () => {
      const newIsMobile = window.innerWidth < 1024;
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
    // Only run on client side
    if (typeof window === "undefined") return;

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isMobile) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isMobile]);

  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setSidebarOpen((prev) => !prev);
    } else {
      setCollapsed((prev) => !prev);
    }
  }, [isMobile]);

  const closeMobileSidebar = useCallback(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  return {
    sidebarOpen,
    setSidebarOpen,
    collapsed,
    setCollapsed,
    isMobile,
    toggleSidebar,
    closeMobileSidebar,
  };
}
