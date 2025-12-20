import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { ButtonProps, ComponentVariant, ComponentSize } from "@/types/components";

const buttonVariants: Record<ComponentVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary/20",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary/20",
  outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground focus:ring-accent/20",
  ghost: "hover:bg-accent hover:text-accent-foreground focus:ring-accent/20",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive/20",
  success: "bg-success text-success-foreground hover:bg-success/90 focus:ring-success/20",
  warning: "bg-warning text-warning-foreground hover:bg-warning/90 focus:ring-warning/20",
  info: "bg-info text-info-foreground hover:bg-info/90 focus:ring-info/20",
};

const buttonSizes: Record<ComponentSize, string> = {
  xs: "h-6 px-2 text-xs",
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  xl: "h-14 px-8 text-lg",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = "primary",
    size = "md",
    loading = false,
    fullWidth = false,
    disabled,
    children,
    ...props
  }, ref) => {
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

          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
