import React from "react";

interface MobileOverlayProps {
  isOpen: boolean;
  mousePosition: { x: number; y: number };
  onClose: () => void;
}

export const MobileOverlay = React.memo(({ isOpen, mousePosition, onClose }: MobileOverlayProps) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-gradient-to-br from-black/80 via-black/60 to-transparent z-40 lg:hidden backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_var(--mouse-x)_var(--mouse-y),rgba(255,255,255,0.1)_0%,transparent_40%)]"
        style={
          {
            "--mouse-x": `${mousePosition.x}px`,
            "--mouse-y": `${mousePosition.y}px`,
          } as React.CSSProperties
        }
      />
    </div>
  );
});

MobileOverlay.displayName = "MobileOverlay";
