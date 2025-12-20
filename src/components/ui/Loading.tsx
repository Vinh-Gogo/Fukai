import React from "react";
import { cn } from "@/lib/utils";

export interface LoadingProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingProps> = ({
  size = "md",
  className
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  return (
    <div
      className={cn(
        "inline-block animate-spin rounded-full border-2 border-current border-t-transparent",
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "rectangular" | "circular";
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = "text",
  width,
  height,
  lines = 1,
  ...props
}) => {
  const baseClasses = "animate-pulse bg-muted rounded";

  if (variant === "text" && lines > 1) {
    return (
      <div className={cn("space-y-2", className)} {...props}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              baseClasses,
              "h-4",
              width ? `w-${width}` : index === lines - 1 ? "w-3/4" : "w-full"
            )}
          />
        ))}
      </div>
    );
  }

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  const variantClasses = {
    text: "h-4 w-full",
    rectangular: "w-full h-32",
    circular: "rounded-full w-12 h-12",
  };

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={style}
      {...props}
    />
  );
};

export interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  children: React.ReactNode;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message = "Loading...",
  children,
  className
}) => {
  if (!isVisible) return <>{children}</>;

  return (
    <div className={cn("relative", className)}>
      {children}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
        <div className="flex flex-col items-center space-y-3">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
};

export interface LoadingStateProps {
  type?: "spinner" | "skeleton" | "overlay";
  size?: "sm" | "md" | "lg";
  message?: string;
  className?: string;
  skeletonLines?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  type = "spinner",
  size = "md",
  message,
  className,
  skeletonLines = 3
}) => {
  if (type === "skeleton") {
    return (
      <div className={cn("space-y-3", className)}>
        <Skeleton lines={skeletonLines} />
      </div>
    );
  }

  if (type === "overlay") {
    return (
      <LoadingOverlay isVisible={true} message={message} className={className}>
        <div className="h-32" />
      </LoadingOverlay>
    );
  }

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-3 py-8", className)}>
      <LoadingSpinner size={size} />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
};
