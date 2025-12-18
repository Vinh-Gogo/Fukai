import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolItemProps {
  name: string;
  href: string;
  icon: LucideIcon;
  collapsed?: boolean;
}

export const ToolItem = React.memo(({ name, href, icon: Icon, collapsed = false }: ToolItemProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "nav-item flex items-center text-sm font-medium",
        collapsed
          ? "justify-center p-2"
          : "gap-3 px-3 py-2",
        isActive ? "active" : ""
      )}
      title={collapsed ? name : undefined}
    >
      <Icon className={cn(
        "flex-shrink-0 text-white",
        collapsed ? "w-7 h-7" : "w-5 h-5"
      )} />
      {!collapsed && name}
    </Link>
  );
});

ToolItem.displayName = "ToolItem";
