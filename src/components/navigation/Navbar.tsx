import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Menu, X } from "lucide-react";

interface NavbarProps {
  title?: string;
  logo?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  title = "Qwen Chat",
  logo,
  children,
  className,
  onMenuClick,
  showMenuButton = false,
}) => {
  return (
    <nav
      className={cn(
        "bg-white border-b border-gray-200 px-4 py-3 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-4">
          {showMenuButton && (
            <Button
              variant="icon"
              size="sm"
              onClick={onMenuClick}
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          {logo && <div className="flex-shrink-0">{logo}</div>}

          {title && (
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          )}
        </div>

        <div className="flex items-center space-x-4">{children}</div>
      </div>
    </nav>
  );
};

export default Navbar;
