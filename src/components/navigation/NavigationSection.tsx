import React from "react";
import { cn } from "@/lib/utils";
import { NavigationItem } from "./NavigationItem";
import { ToolItem } from "./ToolItem";
import { NavigationItemConfig, ToolItemConfig } from "@/config/navigation.config";

interface NavigationSectionProps {
  navigationItems: NavigationItemConfig[];
  toolItems: ToolItemConfig[];
  collapsed: boolean;
}

export const NavigationSection = React.memo(({
  navigationItems,
  toolItems,
  collapsed
}: NavigationSectionProps) => {
  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
      <div className={cn("space-y-1", collapsed ? "py-1 px-1" : "p-1")}>
        {/* Part 1: Main Functions */}
        <div className="space-y-2">
          {!collapsed && (
            <div className="text-xs font-semibold text-white uppercase tracking-wider mb-2">
              Main Functions
            </div>
          )}
          <div className="space-y-1">
            {navigationItems.map((item) => (
              <NavigationItem
                key={item.name}
                name={item.name}
                href={item.href}
                icon={item.icon}
                description={item.description}
                collapsed={collapsed}
              />
            ))}
          </div>
        </div>

        {/* Part 2: System Tools */}
        <div className="space-y-2">
          {!collapsed && (
            <div className="text-sm font-bold text-white uppercase tracking-wider mb-2">
              System Tools
            </div>
          )}
          <div className="space-y-1">
            {toolItems.map((item) => (
              <ToolItem
                key={item.name}
                name={item.name}
                href={item.href}
                icon={item.icon}
                collapsed={collapsed}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

NavigationSection.displayName = "NavigationSection";
