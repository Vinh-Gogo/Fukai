import React, { Suspense, lazy } from "react";
import { Skeleton } from "./Skeleton";

// ============================================================================
// LAZY LOADING COMPONENTS
// ============================================================================

interface LazyComponentProps {
  [key: string]: unknown;
}

interface LazyPageProps {
  [key: string]: unknown;
}

/**
 * Lazy load a component with fallback skeleton
 */
export function lazyLoad(
  importFunc: () => Promise<{
    default: React.ComponentType<LazyComponentProps>;
  }>,
) {
  const LazyComponent = lazy(importFunc);

  const LazyComponentWithRef = React.forwardRef<
    React.ComponentRef<React.ComponentType<LazyComponentProps>>,
    LazyComponentProps
  >((props, ref) => (
    <Suspense fallback={<Skeleton className="w-full h-32" />}>
      <LazyComponent ref={ref} {...props} />
    </Suspense>
  ));

  LazyComponentWithRef.displayName = "LazyComponent";
  return LazyComponentWithRef;
}

/**
 * Create a lazy-loaded page component with proper loading states
 */
export function lazyPage(
  importFunc: () => Promise<{ default: React.ComponentType<LazyPageProps> }>,
) {
  const LazyComponent = lazy(importFunc);

  const LazyPageWithRef = React.forwardRef<
    React.ComponentRef<React.ComponentType<LazyPageProps>>,
    LazyPageProps
  >((props, ref) => (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      }
    >
      <LazyComponent ref={ref} {...props} />
    </Suspense>
  ));

  LazyPageWithRef.displayName = "LazyPage";
  return LazyPageWithRef;
}

// ============================================================================
// PRELOADING UTILITIES
// ============================================================================

/**
 * Preload a component for better UX
 */
export function preloadComponent(importFunc: () => Promise<unknown>): void {
  // Use requestIdleCallback if available, otherwise setTimeout
  const preload = () =>
    importFunc().catch(() => {
      // Ignore preload errors
    });

  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    window.requestIdleCallback(preload, { timeout: 2000 });
  } else {
    setTimeout(preload, 100);
  }
}

/**
 * Preload components on user interaction
 */
export function preloadOnInteraction(
  importFunc: () => Promise<unknown>,
  triggerElement?: HTMLElement,
): void {
  const element = triggerElement || document.body;

  const handleInteraction = () => {
    preloadComponent(importFunc);
    element.removeEventListener("mouseenter", handleInteraction);
    element.removeEventListener("focus", handleInteraction);
    element.removeEventListener("touchstart", handleInteraction);
  };

  element.addEventListener("mouseenter", handleInteraction, { passive: true });
  element.addEventListener("focus", handleInteraction, { passive: true });
  element.addEventListener("touchstart", handleInteraction, { passive: true });
}

// ============================================================================
// ERROR BOUNDARIES FOR LAZY COMPONENTS
// ============================================================================

interface LazyErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Error boundary specifically for lazy-loaded components
 */
export class LazyErrorBoundary extends React.Component<
  LazyErrorBoundaryProps,
  { hasError: boolean; error: Error | null }
> {
  constructor(props: LazyErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error, errorInfo);
    console.error("Lazy component error:", error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            resetError={this.resetError}
          />
        );
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <div className="text-red-500 text-center">
            <h3 className="text-lg font-semibold mb-2">
              Failed to load component
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {this.state.error.message}
            </p>
          </div>
          <button
            onClick={this.resetError}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
