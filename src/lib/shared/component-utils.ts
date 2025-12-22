import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function for merging Tailwind CSS classes
 * Combines clsx and tailwind-merge for optimal class merging
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Standard component patterns and utilities
 */

/**
 * Standard component wrapper with consistent base styles
 */
export const ComponentStyles = {
  base: "transition-all duration-200 ease-out",
  interactive: "cursor-pointer hover:scale-105 active:scale-95",
  disabled: "opacity-50 cursor-not-allowed pointer-events-none",
  loading: "animate-pulse cursor-wait",
  focus:
    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
} as const;

/**
 * Standard color schemes for consistent theming
 */
export const ColorSchemes = {
  primary: {
    bg: "bg-primary",
    text: "text-primary",
    border: "border-primary",
    hover: "hover:bg-primary/90",
    focus: "focus:ring-primary",
  },
  secondary: {
    bg: "bg-secondary",
    text: "text-secondary",
    border: "border-secondary",
    hover: "hover:bg-secondary/90",
    focus: "focus:ring-secondary",
  },
  success: {
    bg: "bg-green-500",
    text: "text-green-600",
    border: "border-green-500",
    hover: "hover:bg-green-600",
    focus: "focus:ring-green-500",
  },
  error: {
    bg: "bg-red-500",
    text: "text-red-600",
    border: "border-red-500",
    hover: "hover:bg-red-600",
    focus: "focus:ring-red-500",
  },
  warning: {
    bg: "bg-yellow-500",
    text: "text-yellow-600",
    border: "border-yellow-500",
    hover: "hover:bg-yellow-600",
    focus: "focus:ring-yellow-500",
  },
} as const;

/**
 * Standard spacing values
 */
export const Spacing = {
  xs: "0.25rem", // 4px
  sm: "0.5rem", // 8px
  md: "1rem", // 16px
  lg: "1.5rem", // 24px
  xl: "2rem", // 32px
  "2xl": "3rem", // 48px
} as const;

/**
 * Standard border radius values
 */
export const BorderRadius = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
} as const;

/**
 * Standard shadow values
 */
export const Shadows = {
  none: "shadow-none",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
  xl: "shadow-xl",
  inner: "shadow-inner",
} as const;

/**
 * Get standardized component classes based on props
 */
export function getComponentClasses(
  baseClass: string,
  {
    disabled = false,
    loading = false,
    interactive = false,
    focusable = true,
    variant = "default",
    size = "md",
  }: {
    disabled?: boolean;
    loading?: boolean;
    interactive?: boolean;
    focusable?: boolean;
    variant?: "default" | "primary" | "secondary" | "outline" | "ghost";
    size?: "sm" | "md" | "lg";
  } = {},
) {
  return cn(baseClass, ComponentStyles.base, {
    [ComponentStyles.disabled]: disabled,
    [ComponentStyles.loading]: loading,
    [ComponentStyles.interactive]: interactive && !disabled && !loading,
    [ComponentStyles.focus]: focusable && !disabled,
  });
}

/**
 * Generate consistent button styles
 */
export function getButtonStyles({
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
}: {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
} = {}) {
  const baseClasses =
    "inline-flex items-center justify-center font-medium transition-all duration-200 ease-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary:
      "bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary",
    secondary:
      "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary",
    outline:
      "border border-border bg-background hover:bg-accent hover:text-accent-foreground focus:ring-border",
    ghost: "hover:bg-accent hover:text-accent-foreground focus:ring-accent",
    destructive:
      "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive",
  };

  const sizeClasses = {
    sm: "h-8 px-3 text-sm rounded-md",
    md: "h-10 px-4 text-base rounded-md",
    lg: "h-12 px-6 text-lg rounded-lg",
  };

  return cn(baseClasses, variantClasses[variant], sizeClasses[size], {
    "w-full": fullWidth,
    "opacity-50 cursor-not-allowed": disabled || loading,
    "cursor-wait": loading,
  });
}

/**
 * Generate consistent input styles
 */
export function getInputStyles({
  error = false,
  disabled = false,
  size = "md",
}: {
  error?: boolean;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
} = {}) {
  const baseClasses =
    "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  const sizeClasses = {
    sm: "h-8 px-2 text-xs",
    md: "h-10 px-3 text-sm",
    lg: "h-12 px-4 text-base",
  };

  return cn(baseClasses, sizeClasses[size], {
    "border-destructive focus-visible:ring-destructive": error,
    "cursor-not-allowed opacity-50": disabled,
  });
}

/**
 * Generate consistent card styles
 */
export function getCardStyles({
  variant = "default",
  hoverable = false,
  size = "md",
}: {
  variant?: "default" | "elevated" | "outlined" | "filled";
  hoverable?: boolean;
  size?: "sm" | "md" | "lg";
} = {}) {
  const baseClasses =
    "rounded-lg border bg-card text-card-foreground shadow-sm";

  const variantClasses = {
    default: "border-border",
    elevated: "border-border shadow-md",
    outlined: "border-2 border-border bg-transparent",
    filled: "border-transparent bg-muted",
  };

  const sizeClasses = {
    sm: "p-3",
    md: "p-6",
    lg: "p-8",
  };

  return cn(baseClasses, variantClasses[variant], sizeClasses[size], {
    "hover:shadow-md transition-shadow duration-200": hoverable,
  });
}

/**
 * Utility for creating consistent component display names
 */
export function createDisplayName(
  componentName: string,
  ...modifiers: string[]
) {
  return [componentName, ...modifiers].filter(Boolean).join("");
}

/**
 * Utility for conditional class application
 */
export function conditionalClasses(
  condition: boolean | undefined | null,
  trueClass: string,
  falseClass: string = "",
): string {
  return condition ? trueClass : falseClass;
}

/**
 * Utility for creating data attributes for testing
 */
export function createTestId(
  component: string,
  element?: string,
  variant?: string,
): string {
  return [component, element, variant].filter(Boolean).join("-");
}
