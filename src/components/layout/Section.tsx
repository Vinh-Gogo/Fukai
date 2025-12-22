import React from "react";
import { cn } from "@/lib/utils";

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  spacing?: "none" | "sm" | "md" | "lg" | "xl";
  container?: boolean;
  containerSize?: "sm" | "md" | "lg" | "xl" | "full";
  children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({
  className,
  spacing = "md",
  container = true,
  containerSize = "xl",
  children,
  ...props
}) => {
  const spacingClasses = {
    none: "",
    sm: "py-8 md:py-12", // 32px mobile, 48px desktop
    md: "py-12 md:py-16", // 48px mobile, 64px desktop
    lg: "py-16 md:py-20", // 64px mobile, 80px desktop
    xl: "py-20 md:py-24", // 80px mobile, 96px desktop
  };

  const containerClasses = container
    ? `max-w-${containerSize === "xl" ? "7xl" : containerSize === "lg" ? "6xl" : containerSize === "md" ? "4xl" : containerSize === "sm" ? "2xl" : "none"} mx-auto px-4 md:px-6`
    : "";

  return (
    <section
      className={cn(
        spacingClasses[spacing],
        container && containerClasses,
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
};

interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "solid" | "dashed" | "dotted";
  thickness?: "thin" | "medium" | "thick";
}

export const Divider: React.FC<DividerProps> = ({
  className,
  variant = "solid",
  thickness = "thin",
  ...props
}) => {
  const variantClasses = {
    solid: "border-solid",
    dashed: "border-dashed",
    dotted: "border-dotted",
  };

  const thicknessClasses = {
    thin: "border-t",
    medium: "border-t-2",
    thick: "border-t-4",
  };

  return (
    <div
      className={cn(
        "border-gray-200",
        variantClasses[variant],
        thicknessClasses[thickness],
        className,
      )}
      {...props}
    />
  );
};

export default Section;
