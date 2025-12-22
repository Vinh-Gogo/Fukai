import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import {
  ButtonProps,
  ComponentVariant,
  ComponentSize,
} from "@/types/components";

const buttonVariants: Record<ComponentVariant, string> = {
  primary:
    "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-200 border border-primary-600",
  secondary:
    "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-300 border border-gray-300",
  outline:
    "border border-gray-300 bg-white hover:bg-gray-50 focus:ring-primary-200 text-gray-700",
  ghost: "hover:bg-gray-100 focus:ring-primary-200 text-gray-700",
  icon: "p-2 hover:bg-gray-100 focus:ring-primary-200 text-gray-700 rounded-md",
  destructive:
    "bg-error-500 text-white hover:bg-error-600 focus:ring-error-200 border border-error-500",
  success:
    "bg-success-500 text-white hover:bg-success-600 focus:ring-success-200 border border-success-500",
  warning:
    "bg-warning-500 text-white hover:bg-warning-600 focus:ring-warning-200 border border-warning-500",
  info: "bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-200 border border-primary-500",
};

const buttonSizes: Record<ComponentSize, string> = {
  xs: "h-6 px-2 text-xs",
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  xl: "h-14 px-8 text-lg",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          "inline-flex items-center justify-center rounded-md font-medium",
          "transition-all duration-200 ease-in-out",
          "focus:outline-none focus:ring-2 focus:ring-offset-2",
          "disabled:opacity-50 disabled:pointer-events-none",
          "active:scale-95 transform",

          // Variant styles
          buttonVariants[variant],

          // Size styles
          buttonSizes[size],

          // Width
          fullWidth && "w-full",

          className,
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
