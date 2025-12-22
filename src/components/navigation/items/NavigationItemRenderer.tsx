import React from "react";
import {
  BaseNavigationItem,
  BaseNavigationItemProps,
} from "./BaseNavigationItem";
import {
  NavigationItemConfig,
  ToolItemConfig,
} from "@/config/navigation.config";

interface NavigationItemRendererProps {
  item: NavigationItemConfig | ToolItemConfig;
  collapsed?: boolean;
  delay?: number;
  onItemClick?: (item: NavigationItemConfig | ToolItemConfig) => void;
}

export const NavigationItemRenderer = React.memo(
  ({
    item,
    collapsed = false,
    delay = 0,
    onItemClick,
  }: NavigationItemRendererProps) => {
    const isToolItem = "gradient" in item && !("description" in item);
    const isBackgroundBarItem = item.href === "#background-bar";

    const baseProps: BaseNavigationItemProps = {
      name: item.name,
      href: item.href,
      icon: item.icon,
      collapsed,
      delay,
      variant: isToolItem ? "tool" : "navigation",
      description: isToolItem
        ? undefined
        : (item as NavigationItemConfig).description,
      onClick: isBackgroundBarItem ? () => onItemClick?.(item) : undefined,
    };

    return <BaseNavigationItem {...baseProps} />;
  },
);

NavigationItemRenderer.displayName = "NavigationItemRenderer";
