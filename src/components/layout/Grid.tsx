import React from "react";
import { cn } from "@/lib/utils";

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: number | string;
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
}

export const Grid: React.FC<GridProps> = ({
  className,
  columns = 12,
  gap = "md",
  children,
  ...props
}) => {
  const gapClasses = {
    none: "gap-0",
    xs: "gap-2", // 8px
    sm: "gap-4", // 16px
    md: "gap-6", // 24px
    lg: "gap-8", // 32px
    xl: "gap-12", // 48px
  };

  const getGridCols = (cols: number | string) => {
    if (typeof cols === "number") {
      return `grid-cols-${cols}`;
    }
    return cols;
  };

  return (
    <div
      className={cn("grid", getGridCols(columns), gapClasses[gap], className)}
      {...props}
    >
      {children}
    </div>
  );
};

interface GridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  span?: number | string;
  start?: number;
  children: React.ReactNode;
}

export const GridItem: React.FC<GridItemProps> = ({
  className,
  span,
  start,
  children,
  ...props
}) => {
  const spanClass = span
    ? typeof span === "number"
      ? `col-span-${span}`
      : span
    : "";
  const startClass = start ? `col-start-${start}` : "";

  return (
    <div className={cn(spanClass, startClass, className)} {...props}>
      {children}
    </div>
  );
};

export default Grid;
