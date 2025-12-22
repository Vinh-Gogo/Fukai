import React from "react";
import { cn } from "@/lib/utils";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "full";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  center?: boolean;
  children: React.ReactNode;
}

export const Container: React.FC<ContainerProps> = ({
  className,
  size = "xl",
  padding = "md",
  center = false,
  children,
  ...props
}) => {
  const sizeClasses = {
    sm: "max-w-2xl", // 672px
    md: "max-w-4xl", // 896px
    lg: "max-w-6xl", // 1152px
    xl: "max-w-7xl", // 1280px
    full: "max-w-none", // No max width
  };

  const paddingClasses = {
    none: "",
    sm: "px-4 py-6 md:px-6", // 16px mobile, 24px desktop
    md: "px-6 py-12 md:px-8", // 24px mobile, 32px desktop
    lg: "px-8 py-16 md:px-12", // 32px mobile, 48px desktop
    xl: "px-12 py-20 md:px-16", // 48px mobile, 64px desktop
  };

  return (
    <div
      className={cn(
        "w-full mx-auto",
        sizeClasses[size],
        paddingClasses[padding],
        center && "flex flex-col items-center justify-center min-h-screen",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Container;
