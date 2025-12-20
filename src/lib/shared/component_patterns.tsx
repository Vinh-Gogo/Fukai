import React, { useState, useCallback, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, getComponentClasses, createDisplayName, createTestId } from './component-utils';
import { BaseComponentProps, InteractiveComponentProps } from '@/types/components';
import type { AnimationVariants, TransitionConfig } from '@/types/components';

// Animation configurations for Framer Motion
export const animationVariants: Record<string, AnimationVariants> = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  slideLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  slideRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
};

// Transition configurations
export const transitionConfig: Record<string, TransitionConfig> = {
  fast: {
    duration: 0.15,
    ease: 'easeOut',
  },
  normal: {
    duration: 0.3,
    ease: 'easeOut',
  },
  slow: {
    duration: 0.5,
    ease: 'easeOut',
  },
  bounce: {
    duration: 0.6,
    ease: [0.68, -0.55, 0.265, 1.55],
  },
  spring: {
    type: 'spring',
    stiffness: 300,
    damping: 30,
  },
};

/**
 * Higher-Order Component for adding loading state to any component
 */
export function withLoading<P extends BaseComponentProps>(
  Component: React.ComponentType<P>
) {
  const WithLoadingComponent = forwardRef<HTMLElement, P & { loading?: boolean; loadingText?: string }>(
    ({ loading = false, loadingText = 'Loading...', ...props }, ref) => {
      if (loading) {
        return (
          <div
            className="flex items-center justify-center p-4"
            data-testid={createTestId('loading-wrapper')}
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">{loadingText}</span>
            </div>
          </div>
        );
      }

      return <Component ref={ref} {...(props as unknown as P)} />;
    }
  );

  WithLoadingComponent.displayName = createDisplayName('WithLoading', Component.displayName || Component.name);
  return WithLoadingComponent;
}

/**
 * Higher-Order Component for adding error boundary to any component
 */
export function withErrorBoundary<P extends BaseComponentProps>(
  Component: React.ComponentType<P>
) {
  class WithErrorBoundary extends React.Component<
    P & { fallback?: React.ComponentType<{ error: Error; retry: () => void }> },
    { hasError: boolean; error?: Error }
  > {
    constructor(props: P & { fallback?: React.ComponentType<{ error: Error; retry: () => void }> }) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      console.error('Component error:', error, errorInfo);
    }

    handleRetry = () => {
      this.setState({ hasError: false, error: undefined });
    };

    render() {
      if (this.state.hasError && this.state.error) {
        const FallbackComponent = this.props.fallback || DefaultErrorFallback;
        return <FallbackComponent error={this.state.error} retry={this.handleRetry} />;
      }

      return <Component {...(this.props as P)} />;
    }
  }

  (WithErrorBoundary as unknown as React.ComponentType).displayName = createDisplayName('WithErrorBoundary', Component.displayName || Component.name);
  return WithErrorBoundary;
}

/**
 * Default error fallback component
 */
const DefaultErrorFallback: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => (
  <div className="flex flex-col items-center justify-center p-6 border border-destructive/20 rounded-lg bg-destructive/5">
    <div className="text-destructive text-sm font-medium mb-2">Something went wrong</div>
    <div className="text-xs text-muted-foreground mb-4 text-center max-w-md">
      {error.message}
    </div>
    <button
      onClick={retry}
      className="px-3 py-1 text-xs bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
    >
      Try again
    </button>
  </div>
);

/**
 * Higher-Order Component for adding animation to any component
 * TODO: Fix Framer Motion type compatibility
 */
export function withAnimation<P extends BaseComponentProps>(
  Component: React.ComponentType<P>,
  animationVariant: keyof typeof animationVariants = 'fadeIn'
) {
  const WithAnimationComponent = forwardRef<HTMLElement, P>((props, ref) => {
    // Temporarily disabled due to Framer Motion type conflicts
    // const animation = animationVariants[animationVariant];

    return (
      <Component ref={ref} {...(props as unknown as P)} />
    );
  });

  WithAnimationComponent.displayName = createDisplayName('WithAnimation', Component.displayName || Component.name);
  return WithAnimationComponent;
}

/**
 * Standardized Button component using consistent patterns
 */
export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  leftIcon?: React.ComponentType<{ className?: string }>;
  rightIcon?: React.ComponentType<{ className?: string }>;
  fullWidth?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  loading?: boolean;
  tabIndex?: number;
  'aria-label'?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className,
  children,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  fullWidth = false,
  onClick,
  ...props
}, ref) => {
  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    onClick?.(e);
  }, [disabled, loading, onClick]);

  return (
    <button
      ref={ref}
      className={getComponentClasses(
        cn(
          'inline-flex items-center justify-center font-medium',
          'transition-all duration-200 ease-out',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          {
            // Variants
            'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary': variant === 'primary',
            'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary': variant === 'secondary',
            'border border-border bg-background hover:bg-accent hover:text-accent-foreground focus:ring-border': variant === 'outline',
            'hover:bg-accent hover:text-accent-foreground focus:ring-accent': variant === 'ghost',
            'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive': variant === 'destructive',

            // Sizes
            'h-8 px-3 text-sm rounded-md': size === 'sm',
            'h-10 px-4 text-base rounded-md': size === 'md',
            'h-12 px-6 text-lg rounded-lg': size === 'lg',

            // States
            'w-full': fullWidth,
            'cursor-wait opacity-75': loading,
            'cursor-not-allowed': disabled,
          }
        ),
        { disabled, loading }
      )}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {LeftIcon && <LeftIcon className="w-4 h-4 mr-2" />}
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      )}
      {children}
      {RightIcon && <RightIcon className="w-4 h-4 ml-2" />}
    </button>
  );
});

Button.displayName = 'Button';

/**
 * Standardized Card component
 */
export interface CardProps extends BaseComponentProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  hoverable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({
  variant = 'default',
  hoverable = false,
  size = 'md',
  className,
  children,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm',
        'transition-all duration-200 ease-out',
        {
          // Variants
          'border-border': variant === 'default',
          'border-border shadow-md': variant === 'elevated',
          'border-2 border-border bg-transparent': variant === 'outlined',
          'border-transparent bg-muted': variant === 'filled',

          // Sizes
          'p-3': size === 'sm',
          'p-6': size === 'md',
          'p-8': size === 'lg',

          // States
          'hover:shadow-md transition-shadow duration-200': hoverable,
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

/**
 * Standardized Input component
 */
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  error?: boolean;
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ComponentType<{ className?: string }>;
  rightIcon?: React.ComponentType<{ className?: string }>;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  className,
  error = false,
  size = 'md',
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  ...props
}, ref) => {
  return (
    <div className="relative">
      {LeftIcon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <LeftIcon className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
      <input
        ref={ref}
        className={cn(
          'flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm',
          'ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-colors',
          {
            // Sizes
            'h-8 px-2 text-xs': size === 'sm',
            'h-10 px-3 text-sm': size === 'md',
            'h-12 px-4 text-base': size === 'lg',

            // Left icon padding
            'pl-10': LeftIcon,
            'pr-10': RightIcon,

            // Error state
            'border-destructive focus-visible:ring-destructive': error,
          },
          className
        )}
        {...props}
      />
      {RightIcon && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <RightIcon className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

/**
 * Hook for managing modal state
 */
export function useModal(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  return { isOpen, open, close, toggle };
}

/**
 * Hook for managing loading state
 */
export function useLoadingState(initialLoading = false) {
  const [isLoading, setIsLoading] = useState(initialLoading);

  const startLoading = useCallback(() => setIsLoading(true), []);
  const stopLoading = useCallback(() => setIsLoading(false), []);
  const toggleLoading = useCallback(() => setIsLoading(prev => !prev), []);

  return { isLoading, startLoading, stopLoading, toggleLoading };
}

/**
 * Hook for managing async operations with loading and error states
 */
export function useAsyncOperation() {
  const loadingState = useLoadingState();
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async <T,>(
      operation: () => Promise<T>,
      onSuccess?: (result: T) => void,
      onError?: (error: Error) => void
    ): Promise<T | null> => {
      try {
        loadingState.startLoading();
        setError(null);
        const result = await operation();
        onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
        return null;
      } finally {
        loadingState.stopLoading();
      }
    },
    [loadingState]
  );

  const reset = useCallback(() => {
    setError(null);
    loadingState.stopLoading();
  }, [loadingState]);

  return {
    ...loadingState,
    error,
    execute,
    reset,
  };
}
