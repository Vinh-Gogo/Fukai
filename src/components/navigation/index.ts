// Navigation Components Barrel Export

// Main Navigation Component
export { Navigation } from './Navigation';

// Layout Components
export { BrandHeaderMini, NavigationSection } from './layout';

// Control Components
export { NavigationControls } from './controls';

// Item Components
export { BaseNavigationItem, NavigationItemRenderer } from './items';
export type { BaseNavigationItemProps } from './items';

// UI Components
export { NavigationSkeleton } from './ui';

// Legacy exports for backward compatibility
// (These can be deprecated in future versions)
export { BaseNavigationItem as NavigationItem } from './items';
export { NavigationItemRenderer as ToolItem } from './items';

// Re-export types if needed
export type { NavigationItemConfig, ToolItemConfig } from '../../config/navigation.config';
