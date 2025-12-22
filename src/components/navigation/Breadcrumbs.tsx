import React from "react";
import { cn } from "@/lib/utils";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  className?: string;
  maxItems?: number;
  showHome?: boolean;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  separator,
  className,
  maxItems = 5,
  showHome = true,
}) => {
  const displayItems =
    items.length > maxItems
      ? [
          items[0],
          { label: "...", href: undefined },
          ...items.slice(-maxItems + 2),
        ]
      : items;

  const allItems = showHome
    ? [{ label: "Home", href: "/" }, ...displayItems]
    : displayItems;

  const defaultSeparator = <ChevronRight className="h-4 w-4 text-gray-400" />;

  return (
    <nav
      className={cn("flex items-center space-x-2 text-sm", className)}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-2">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const isClickable = item.href || item.onClick;

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <span className="mx-2 text-gray-400">
                  {separator || defaultSeparator}
                </span>
              )}

              {isLast ? (
                <span className="text-gray-900 font-medium" aria-current="page">
                  {item.label}
                </span>
              ) : isClickable ? (
                <button
                  onClick={item.onClick}
                  className={cn(
                    "text-gray-600 hover:text-primary-600 transition-colors duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-primary-200 focus:ring-offset-2 rounded",
                  )}
                  aria-label={`Go to ${item.label}`}
                >
                  {index === 0 && showHome && <Home className="h-4 w-4 mr-1" />}
                  {item.label}
                </button>
              ) : (
                <span className="text-gray-500">
                  {index === 0 && showHome && <Home className="h-4 w-4 mr-1" />}
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
