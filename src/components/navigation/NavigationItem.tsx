import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationItemProps {
  name: string;
  href: string;
  icon: LucideIcon;
  description: string;
  collapsed?: boolean;
}

export const NavigationItem = React.memo(({ name, href, icon: Icon, description, collapsed = false }: NavigationItemProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "nav-item flex items-center text-white font-medium",
        collapsed
          ? "justify-center p-2"
          : "gap-3 px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors",
        isActive ? "active" : ""
      )}
      title={collapsed ? name : undefined}
    >
      <Icon className={cn(
        "flex-shrink-0",
        collapsed ? "w-6 h-6 text-white" : "w-5 h-5"
      )} />
      {!collapsed && (
        <div className="flex-1 min-w-0">
          <div className="font-medium text-white">{name}</div>
          <div className="text-sm text-gray-400 truncate">
            {description}
          </div>
        </div>
      )}
    </Link>
  );
});

NavigationItem.displayName = "NavigationItem";
