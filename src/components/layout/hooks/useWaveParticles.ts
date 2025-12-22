import { useEffect, useRef } from 'react';

interface ParticleConfig {
  minSize: number;
  maxSize: number;
  minDuration: number;
  maxDuration: number;
  maxDelay: number;
  minOpacity: number;
  maxOpacity: number;
  maxBottom: number;
  hueRange: { min: number; max: number };
  saturationRange: { min: number; max: number };
  lightnessRange: { min: number; max: number };
}

const DEFAULT_PARTICLE_CONFIG: ParticleConfig = {
  minSize: 20,
  maxSize: 60,
  minDuration: 3,
  maxDuration: 8,
  maxDelay: 4,
  minOpacity: 0.1,
  maxOpacity: 0.5,
  maxBottom: 25,
  hueRange: { min: 190, max: 220 },
  saturationRange: { min: 65, max: 90 },
  lightnessRange: { min: 55, max: 75 },
};

export function useWaveParticles(
  particleCount: number = 24,
  config: Partial<ParticleConfig> = {}
): React.RefObject<HTMLDivElement | null> {
  const containerRef = useRef<HTMLDivElement>(null);
  const finalConfig = { ...DEFAULT_PARTICLE_CONFIG, ...config };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const createParticle = (): HTMLElement => {
      const particle = document.createElement('div');

      // Random properties based on config
      const size = Math.random() * (finalConfig.maxSize - finalConfig.minSize) + finalConfig.minSize;
      const duration = Math.random() * (finalConfig.maxDuration - finalConfig.minDuration) + finalConfig.minDuration;
      const delay = Math.random() * finalConfig.maxDelay;
      const opacity = Math.random() * (finalConfig.maxOpacity - finalConfig.minOpacity) + finalConfig.minOpacity;
      const left = Math.random() * 100;
      const bottom = Math.random() * finalConfig.maxBottom;

      // Color generation
      const hue = Math.random() * (finalConfig.hueRange.max - finalConfig.hueRange.min) + finalConfig.hueRange.min;
      const saturation = Math.random() * (finalConfig.saturationRange.max - finalConfig.saturationRange.min) + finalConfig.saturationRange.min;
      const lightness = Math.random() * (finalConfig.lightnessRange.max - finalConfig.lightnessRange.min) + finalConfig.lightnessRange.min;

      // Apply styles
      particle.className = 'wave-particle absolute rounded-full';
      Object.assign(particle.style, {
        width: `${size}px`,
        height: `${size}px`,
        left: `${left}%`,
        bottom: `${bottom}%`,
        backgroundColor: `hsla(${hue}, ${saturation}%, ${lightness}%, ${opacity})`,
        boxShadow: `0 0 ${size/3}px rgba(17, 100, 200, ${opacity * 0.8})`,
        animation: `coastal-float ${duration}s ease-in-out ${delay}s infinite, coastal-pulse ${duration * 1.2}s ease-in-out ${delay}s infinite`,
      });

      return particle;
    };

    const createWaves = (): void => {
      // Clear existing particles
      container.innerHTML = '';

      // Create new particles
      for (let i = 0; i < particleCount; i++) {
        container.appendChild(createParticle());
      }
    };

    createWaves();

    // Recreate particles on window resize
    const handleResize = () => createWaves();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [particleCount, finalConfig]);

  return containerRef;
}
