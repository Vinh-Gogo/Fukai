import React from "react";
import { motion } from "framer-motion";

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
      className="fixed top-4 z-[100] transition-all duration-300 hover:scale-110 flex items-center justify-center"
      aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
      title={collapsed ? "Expand Navigation" : "Collapse Navigation"}
      style={{
        left: position,
        width: '60px',
        height: '60px',
        ...styles,
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
        backdropFilter: 'none',
        padding: 0,
        margin: 0,
      }}
    >
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.7, 1, 0.8],
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
        className="relative w-20 h-20"
      >
        {/* Brown poop SVG - identical shape to � emoji */}
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <radialGradient id="brown-poop-gradient" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#8B4513" stopOpacity="1" />
              <stop offset="30%" stopColor="#A0522D" stopOpacity="0.95" />
              <stop offset="60%" stopColor="#CD853F" stopOpacity="0.85" />
              <stop offset="85%" stopColor="#D2691E" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#654321" stopOpacity="0" />
            </radialGradient>
            <filter id="glow-filter" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          
          {/* 💩 emoji shape path - recreated exactly */}
          <path
            d="M30,80 Q35,70 40,75 Q45,85 50,80 Q55,75 60,80 Q65,90 70,85 Q75,80 80,85 Q85,95 90,90 Q95,85 100,90 L95,60 Q90,55 85,60 Q80,50 75,55 Q70,45 65,50 Q60,40 55,45 Q50,35 45,40 Q40,30 35,35 Q30,25 25,30 L20,60 Q15,65 10,60 Q5,55 0,60 Z"
            fill="url(#brown-poop-gradient)"
            filter="url(#glow-filter)"
            className="transition-all duration-300"
            style={{
              transform: collapsed ? 'scale(0.8)' : 'scale(1)',
              filter: collapsed
                ? 'drop-shadow(0 0 5px rgba(139, 69, 19, 0.3))'
                : 'drop-shadow(0 0 15px rgba(160, 82, 45, 0.8)) brightness(1.1)',
            }}
          />
        </svg>
        
        {/* Intense glow effect */}
        <div
          className="absolute inset-0 rounded-full blur-xl"
          style={{
            background: collapsed
              ? 'radial-gradient(circle, rgba(139, 69, 19, 0.2) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(160, 82, 45, 0.7) 0%, transparent 70%)',
            animation: collapsed
              ? 'pulse 5s infinite'
              : 'pulse 1s infinite'
          }}
        />

        {/* Extra glow for intensity */}
        <div
          className="absolute inset-0 rounded-full blur-2xl"
          style={{
            background: 'radial-gradient(circle, rgba(210, 180, 140, 0.3) 0%, transparent 80%)',
            animation: 'pulse 1.5s infinite alternate'
          }}
        />
      </motion.div>
    </button>
  );
});

CollapseToggle.displayName = "CollapseToggle";

// Add pulse animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 0.7; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.1); }
    }
  `;
  document.head.appendChild(style);
}
