/**
 * Navigation hooks - centralized exports
 */

// Navigation state management hooks
export { useNavigationState } from './useNavigationState';

// Keyboard navigation hooks
export { useKeyboardNavigation } from './useKeyboardNavigation';

// Mobile detection hooks
export { useMobileDetection } from './useMobileDetection';

// Mouse interaction hooks
export { useMouseInteraction } from './useMouseInteraction';

// Mouse tracking hooks
export { useMouseTracking } from './useMouseTracking';

// Re-export types for convenience
export type {
  NavigationState,
  NavigationMode,
  UseNavigationStateResult,
} from '@/types/navigation';
