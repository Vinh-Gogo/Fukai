import { useState, useEffect } from "react";

interface MousePosition {
  x: number;
  y: number;
}

interface UseMouseInteractionReturn {
  mousePosition: MousePosition;
  activeGradient: string;
  setActiveGradient: (href: string) => void;
}

/**
 * Custom hook to handle mouse interactions for interactive backgrounds and hover effects
 */
export function useMouseInteraction(): UseMouseInteractionReturn {
  const [mousePosition, setMousePosition] = useState<MousePosition>({
    x: 0,
    y: 0,
  });
  const [activeGradient, setActiveGradient] = useState("");

  // Track mouse position for interactive background effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return {
    mousePosition,
    activeGradient,
    setActiveGradient,
  };
}
