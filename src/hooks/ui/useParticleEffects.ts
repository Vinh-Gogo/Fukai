import { useState } from "react";

interface ParticleStyle {
  width: number;
  height: number;
  left: number;
  top: number;
  animationDelay: number;
  animationDuration: number;
  colorClass: string;
}

interface UseParticleEffectsReturn {
  particleStyles: ParticleStyle[];
}

/**
 * Custom hook to generate stable particle styles for floating background effects
 */
export function useParticleEffects(
  particleCount: number = 15,
): UseParticleEffectsReturn {
  // Generate stable random values for particles (lazy initializer runs once)
  const [particleStyles] = useState<ParticleStyle[]>(() =>
    [...Array(particleCount)].map((_, i) => ({
      width: Math.random() * 8 + 2,
      height: Math.random() * 8 + 2,
      left: Math.random() * 100,
      top: Math.random() * 100,
      animationDelay: Math.random() * 5,
      animationDuration: Math.random() * 10 + 10,
      colorClass:
        i % 3 === 0
          ? "bg-blue-400"
          : i % 3 === 1
            ? "bg-purple-400"
            : "bg-cyan-400",
    })),
  );

  return {
    particleStyles,
  };
}
