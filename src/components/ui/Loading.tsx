import React from "react";
import { cn } from "@/lib/utils";

export interface LoadingProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingProps> = ({
  size = "md",
  className,
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
        "inline-block animate-spin rounded-full border-2 border-gray-300 border-t-primary-600",
        sizeClasses[size],
        className,
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
              width ? `w-${width}` : index === lines - 1 ? "w-3/4" : "w-full",
            )}
          />
        ))}
      </div>
    );
  }

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === "number" ? `${width}px` : width;
  if (height)
    style.height = typeof height === "number" ? `${height}px` : height;

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
  className,
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

export interface ProgressBarProps {
  value: number; // 0-100
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "error";
  showPercentage?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  size = "md",
  variant = "default",
  showPercentage = false,
  className,
}) => {
  const clampedValue = Math.min(Math.max(value, 0), 100);

  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  const variantClasses = {
    default: "bg-primary-600",
    success: "bg-success-500",
    warning: "bg-warning-500",
    error: "bg-error-500",
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "w-full bg-gray-200 rounded-full overflow-hidden",
          sizeClasses[size],
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-out",
            variantClasses[variant],
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      {showPercentage && (
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-500">
            {Math.round(clampedValue)}%
          </span>
        </div>
      )}
    </div>
  );
};

export interface LoadingStateProps {
  type?: "spinner" | "skeleton" | "overlay" | "progress";
  size?: "sm" | "md" | "lg";
  message?: string;
  className?: string;
  skeletonLines?: number;
  progressValue?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  type = "spinner",
  size = "md",
  message,
  className,
  skeletonLines = 3,
  progressValue = 0,
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

  if (type === "progress") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center space-y-3 py-8",
          className,
        )}
      >
        <ProgressBar value={progressValue} size={size} />
        {message && <p className="text-sm text-gray-600">{message}</p>}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center space-y-3 py-8",
        className,
      )}
    >
      <LoadingSpinner size={size} />
      {message && <p className="text-sm text-gray-600">{message}</p>}
    </div>
  );
};
