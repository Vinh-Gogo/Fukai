import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CollapseToggleProps {
  collapsed: boolean;
  position: number;
  styles: React.CSSProperties;
  filter: string;
  onClick: () => void;
}

export const CollapseToggle = React.memo(({
  collapsed,
  position,
  styles,
  filter,
  onClick
}: CollapseToggleProps) => {
  return (
    <button
      onClick={onClick}
      className="fixed top-4 z-[100] transition-all duration-300 hover:scale-110 backdrop-blur-sm flex items-center justify-center"
      aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
      title={collapsed ? "Expand Navigation" : "Collapse Navigation"}
      style={{
        left: position,
        width: '40px',
        height: '40px',
        ...styles,
        backdropFilter: "blur(10px)",
      }}
    >
      <img
        src="/favicon.ico"
        alt={collapsed ? "Expand navigation" : "Collapse navigation"}
        className="w-5 h-5 transition-all duration-300"
        style={{
          transform: collapsed ? 'rotate(-90deg)' : 'rotate(180deg)',
          filter,
        }}
      />
    </button>
  );
});

CollapseToggle.displayName = "CollapseToggle";
