/**
 * Centralized navigation-related types and interfaces
 */

import { LucideIcon } from "lucide-react";

// Core Navigation Types
export interface NavigationItemConfig {
  name: string;
  href: string;
  icon: LucideIcon;
  description: string;
  gradient: string;
}

export interface ToolItemConfig {
  name: string;
  href: string;
  icon: LucideIcon;
  gradient: string;
}

// Navigation State Types
export interface NavigationState {
  sidebarOpen: boolean;
  collapsed: boolean;
  isMobile: boolean;
}

export type NavigationMode = "desktop" | "mobile";

// Hook Result Types
export interface UseNavigationStateResult {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
  closeMobileSidebar: () => void;
}

// Component Props Types
export interface NavigationProps {
  className?: string;
}

export interface NavigationItemProps {
  item: NavigationItemConfig;
  isActive?: boolean;
  isCollapsed?: boolean;
  onClick?: () => void;
  className?: string;
}

export interface NavigationSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export interface ToolItemProps {
  item: ToolItemConfig;
  onClick?: () => void;
  className?: string;
}

export interface NavigationControlsProps {
  onToggle: () => void;
  isOpen: boolean;
  isMobile: boolean;
  className?: string;
}

export interface BrandHeaderMiniProps {
  onClick?: () => void;
  className?: string;
}

// Utility Types
export interface NavigationConfig {
  items: NavigationItemConfig[];
  tools: ToolItemConfig[];
}

export interface NavigationContext {
  state: NavigationState;
  config: NavigationConfig;
  actions: {
    toggleSidebar: () => void;
    closeMobileSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    setCollapsed: (collapsed: boolean) => void;
  };
}

// Constants
export const NAVIGATION_BREAKPOINTS = {
  MOBILE: 1024,
  TABLET: 768,
  DESKTOP: 1024,
} as const;

export const NAVIGATION_MODES = {
  DESKTOP: "desktop" as const,
  MOBILE: "mobile" as const,
};

// Type Guards
export const isNavigationItemConfig = (
  obj: unknown,
): obj is NavigationItemConfig => {
  const item = obj as Record<string, unknown>;
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof item.name === "string" &&
    typeof item.href === "string" &&
    typeof item.description === "string" &&
    typeof item.gradient === "string" &&
    typeof item.icon === "function"
  );
};

export const isToolItemConfig = (obj: unknown): obj is ToolItemConfig => {
  const item = obj as Record<string, unknown>;
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof item.name === "string" &&
    typeof item.href === "string" &&
    typeof item.gradient === "string" &&
    typeof item.icon === "function"
  );
};

// Utility Functions
export const getNavigationMode = (width: number): NavigationMode => {
  return width < NAVIGATION_BREAKPOINTS.MOBILE ? "mobile" : "desktop";
};

export const shouldAutoCollapse = (
  mode: NavigationMode,
  isCollapsed: boolean,
): boolean => {
  return mode === "mobile" && !isCollapsed;
};

export const getNavigationItemKey = (item: NavigationItemConfig): string => {
  return item.href.replace("/", "").toLowerCase() || "home";
};

export const isNavigationItemActive = (
  item: NavigationItemConfig,
  currentPath: string,
): boolean => {
  if (item.href === "/") {
    return currentPath === "/";
  }
  return currentPath.startsWith(item.href);
};

// Factory Functions
export const createNavigationItemConfig = (
  name: string,
  href: string,
  icon: LucideIcon,
  description: string,
  gradient: string,
): NavigationItemConfig => ({
  name,
  href,
  icon,
  description,
  gradient,
});

export const createToolItemConfig = (
  name: string,
  href: string,
  icon: LucideIcon,
  gradient: string,
): ToolItemConfig => ({
  name,
  href,
  icon,
  gradient,
});

export const createDefaultNavigationState = (): NavigationState => ({
  sidebarOpen: false,
  collapsed: false,
  isMobile: false,
});

// Validation Functions
export const validateNavigationConfig = (config: NavigationConfig): boolean => {
  return (
    Array.isArray(config.items) &&
    Array.isArray(config.tools) &&
    config.items.every(isNavigationItemConfig) &&
    config.tools.every(isToolItemConfig)
  );
};

export const validateNavigationState = (state: NavigationState): boolean => {
  return (
    typeof state.sidebarOpen === "boolean" &&
    typeof state.collapsed === "boolean" &&
    typeof state.isMobile === "boolean"
  );
};
