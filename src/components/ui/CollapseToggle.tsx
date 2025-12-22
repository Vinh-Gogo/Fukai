import React, { useState, useEffect, useId } from "react";
import { motion } from "framer-motion";

// ============================================================================
// Types
// ============================================================================

interface CollapseToggleProps {
  collapsed: boolean;
  onClick: () => void;
}

// ============================================================================
// Custom Hook: useRandomPosition
// ============================================================================

// Generate random position only once on client
const generateRandomPosition = () => ({
  top: Math.random() * 70 + 10, // 10% to 80%
  left: Math.random() * 70 + 10,
});

const useRandomPosition = () => {
  // Lazy initialization - only runs on first render
  const [position] = useState(() => 
    typeof window !== 'undefined' ? generateRandomPosition() : { top: 50, left: 50 }
  );
  
  // Track if we're on client
  const [isMounted, setIsMounted] = useState(typeof window !== 'undefined');

  // For SSR: set mounted after hydration via subscription pattern
  useEffect(() => {
    if (!isMounted) {
      // Use requestAnimationFrame to avoid synchronous setState
      const id = requestAnimationFrame(() => setIsMounted(true));
      return () => cancelAnimationFrame(id);
    }
  }, [isMounted]);

  return { position, isMounted };
};



// ============================================================================
// Sub-component: FlySVG
// ============================================================================

interface FlySVGProps {
  uniqueId: string;
}

const FlySVG = React.memo(({ uniqueId }: FlySVGProps) => {
  const bodyGradientId = `fly-body-${uniqueId}`;
  const wingGradientId = `fly-wing-${uniqueId}`;

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
      <defs>
        <radialGradient id={bodyGradientId} cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#4a4a4a" />
          <stop offset="100%" stopColor="#1a1a1a" />
        </radialGradient>
        <radialGradient id={wingGradientId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(200, 220, 255, 0.6)" />
          <stop offset="100%" stopColor="rgba(150, 180, 220, 0.3)" />
        </radialGradient>
      </defs>

      {/* Wings */}
      <motion.ellipse
        cx="30" cy="45" rx="22" ry="12"
        fill={`url(#${wingGradientId})`}
        stroke="rgba(100, 130, 180, 0.5)"
        strokeWidth="0.5"
        style={{ transformOrigin: '45px 50px' }}
        animate={{ rotate: [-15, 15, -15] }}
        transition={{ duration: 0.05, repeat: Infinity }}
      />
      <motion.ellipse
        cx="70" cy="45" rx="22" ry="12"
        fill={`url(#${wingGradientId})`}
        stroke="rgba(100, 130, 180, 0.5)"
        strokeWidth="0.5"
        style={{ transformOrigin: '55px 50px' }}
        animate={{ rotate: [15, -15, 15] }}
        transition={{ duration: 0.05, repeat: Infinity }}
      />

      {/* Body */}
      <ellipse cx="50" cy="55" rx="12" ry="15" fill={`url(#${bodyGradientId})`} />
      <ellipse cx="50" cy="72" rx="10" ry="12" fill={`url(#${bodyGradientId})`} />

      {/* Head */}
      <circle cx="50" cy="38" r="10" fill={`url(#${bodyGradientId})`} />

      {/* Eyes */}
      <ellipse cx="44" cy="35" rx="5" ry="6" fill="#8B0000" />
      <ellipse cx="43" cy="34" rx="2" ry="2.5" fill="#ff4444" opacity="0.6" />
      <ellipse cx="56" cy="35" rx="5" ry="6" fill="#8B0000" />
      <ellipse cx="57" cy="34" rx="2" ry="2.5" fill="#ff4444" opacity="0.6" />

      {/* Legs */}
      <g stroke="#1a1a1a" strokeWidth="1.5" fill="none">
        <path d="M42,58 Q35,62 28,68" />
        <path d="M40,65 Q32,70 25,78" />
        <path d="M42,72 Q35,78 30,88" />
        <path d="M58,58 Q65,62 72,68" />
        <path d="M60,65 Q68,70 75,78" />
        <path d="M58,72 Q65,78 70,88" />
      </g>

      {/* Antennae */}
      <g stroke="#1a1a1a" strokeWidth="1" fill="none">
        <path d="M46,30 Q44,24 40,20" />
        <path d="M54,30 Q56,24 60,20" />
      </g>
    </svg>
  );
});

FlySVG.displayName = "FlySVG";



// ============================================================================
// Main Component: CollapseToggle
// ============================================================================

export const CollapseToggle = React.memo(({ collapsed, onClick }: CollapseToggleProps) => {
  const uniqueId = useId();
  const { position, isMounted } = useRandomPosition();

  if (!isMounted) return null;

  return (
    <button
      onClick={onClick}
      className="fixed z-[100] transition-all duration-300 hover:scale-125 flex items-center justify-center cursor-pointer"
      aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
      title="🪰 Click: Toggle Navigation"
      style={{
        top: `${position.top}%`,
        left: `${position.left}%`,
        width: '50px',
        height: '50px',
        background: 'transparent',
        border: 'none',
        transform: 'translate(-50%, -50%)',
      }}
    >
      <motion.div
        animate={{
          rotate: [0, 5, -5, 3, -3, 0],
          x: [0, 2, -2, 1, -1, 0],
          y: [0, -2, 2, -1, 1, 0],
        }}
        transition={{ duration: 0.3, repeat: Infinity, ease: "linear" }}
        className="relative w-12 h-12"
      >
        <FlySVG uniqueId={uniqueId} />
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-2 rounded-full bg-black/20 blur-sm" />
      </motion.div>
    </button>
  );
});

CollapseToggle.displayName = "CollapseToggle";
