import React from "react";
import { cn } from "@/lib/utils";
import { InputProps, TextareaProps } from "@/types/components";

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      error,
      helperText,
      size,
      leftAddon,
      rightAddon,
      clearable,
      ...props
    },
    ref,
  ) => {
    return (
      <div className="space-y-1">
        <div className="relative">
          {leftAddon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              {leftAddon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex h-10 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium",
              "placeholder:text-gray-500",
              "focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-600",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
              "transition-all duration-200",
              "hover:border-gray-400",
              type === "search" && "pl-10 pr-4",
              error && "border-red-500 focus:ring-red-200 focus:border-red-500",
              leftAddon && "pl-10",
              rightAddon && "pr-10",
              className,
            )}
            ref={ref}
            {...props}
          />
          {rightAddon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {rightAddon}
            </div>
          )}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {helperText && !error && (
          <p className="text-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, helperText, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm",
            "placeholder:text-gray-500",
            "focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-600",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
            "transition-all duration-200",
            "hover:border-gray-400",
            "resize-none",
            error && "border-red-500 focus:ring-red-200 focus:border-red-500",
            className,
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        {helperText && !error && (
          <p className="text-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
