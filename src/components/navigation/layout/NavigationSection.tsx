import React from "react";
import { cn } from "@/lib/utils";
import { NavigationItemRenderer } from "../items";
import {
  NavigationItemConfig,
  ToolItemConfig,
} from "@/config/navigation.config";
import { useBackgroundBar } from "@/hooks/layout";
import { BackgroundBarPopup } from "@/components/layout";

interface NavigationSectionProps {
  navigationItems: NavigationItemConfig[];
  toolItems: ToolItemConfig[];
  collapsed: boolean;
}

export const NavigationSection = React.memo(
  ({ navigationItems, toolItems, collapsed }: NavigationSectionProps) => {
    const { config } = useBackgroundBar();
    const [showPopup, setShowPopup] = React.useState(false);
    const backgroundBarButtonRef = React.useRef<HTMLDivElement | null>(null);

    const handleToolItemClick = (
      item: NavigationItemConfig | ToolItemConfig,
    ) => {
      if ((item as ToolItemConfig).href === "#background-bar") {
        setShowPopup(!showPopup);
      }
    };

    const closePopup = React.useCallback(() => {
      setShowPopup(false);
    }, []);

    return (
      <>
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          <div className={cn("space-y-2", collapsed ? "py-1 px-1" : "p-1")}>
            {/* Part 1: Main Functions */}
            <div className="space-y-2">
              {!collapsed && (
                <div className="text-sm font-semibold text-white uppercase tracking-wider mb-2">
                  Main Functions
                </div>
              )}
              <div className="space-y-2">
                {navigationItems.map((item, index) => (
                  <NavigationItemRenderer
                    key={item.name}
                    item={item}
                    collapsed={collapsed}
                    delay={index * 50}
                  />
                ))}
              </div>
            </div>

            {/* Part 2: System Tools */}
            <div className="space-y-2">
              {!collapsed && (
                <div className="text-sm font-semibold text-white uppercase tracking-wider mb-2">
                  System Tools
                </div>
              )}
              <div className="space-y-2">
                {toolItems.map((item, index) => (
                  <NavigationItemRenderer
                    key={item.name}
                    item={item}
                    collapsed={collapsed}
                    delay={(navigationItems.length + index) * 50}
                    onItemClick={handleToolItemClick}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Background Bar Popup */}
        {showPopup && (
          <BackgroundBarPopup
            isOpen={showPopup}
            onClose={closePopup}
            buttonRef={backgroundBarButtonRef}
          />
        )}
      </>
    );
  },
);

NavigationSection.displayName = "NavigationSection";
