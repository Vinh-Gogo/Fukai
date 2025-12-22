import { useEffect, useRef } from 'react';

interface GradientStop {
  offset: string;
  color: string;
}

interface CoastlineConfig {
  widthMultiplier: number;
  height: number;
  pointSpacing: number;
  gradientStops: readonly GradientStop[];
}

export function useCoastlineEffect(
  widthMultiplier: number,
  height: number,
  pointSpacing: number,
  gradientStops: readonly GradientStop[]
): React.RefObject<HTMLDivElement | null> {
  const coastlineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const coastline = coastlineRef.current;
    if (!coastline) return;

    const createCoastline = (): void => {
      coastline.innerHTML = '';

      // Calculate actual dimensions
      const actualWidth = 100 * widthMultiplier; // viewport width percentage * multiplier
      const viewBoxWidth = actualWidth * 10; // scale for smooth curves

      // Create SVG with proper namespace
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", `${actualWidth}%`);
      svg.setAttribute("height", "100%");
      svg.setAttribute("viewBox", `0 0 ${viewBoxWidth} ${height}`);
      svg.setAttribute("preserveAspectRatio", "none");

      // Create the coastline path
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const pathData = generateCoastlinePath(viewBoxWidth, height, pointSpacing);

      path.setAttribute("d", pathData);
      path.setAttribute("fill", "url(#coastlineGradient)");

      // Create gradient definition
      const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      const gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");

      gradient.setAttribute("id", "coastlineGradient");
      gradient.setAttribute("x1", "0%");
      gradient.setAttribute("y1", "0%");
      gradient.setAttribute("x2", "0%");
      gradient.setAttribute("y2", "100%");

      // Add gradient stops
      gradientStops.forEach(stop => {
        const stopElement = document.createElementNS("http://www.w3.org/2000/svg", "stop");
        stopElement.setAttribute("offset", stop.offset);
        stopElement.setAttribute("stop-color", stop.color);
        gradient.appendChild(stopElement);
      });

      defs.appendChild(gradient);
      svg.appendChild(defs);
      svg.appendChild(path);
      coastline.appendChild(svg);
    };

    const generateCoastlinePath = (
      width: number,
      height: number,
      spacing: number
    ): string => {
      let pathData = `M0,${height * 0.7} `;

      // Generate natural shoreline using multiple sine waves
      for (let x = 0; x <= width; x += spacing) {
        // Combine multiple frequency waves for natural variation
        const lowFreq = Math.sin(x * 0.002) * 15;
        const midFreq = Math.sin(x * 0.008) * 8;
        const highFreq = Math.sin(x * 0.02) * 4;
        const noise = (Math.random() - 0.5) * 3;

        // Natural shoreline height (lower values = closer to shore)
        const y = height * 0.7 + lowFreq + midFreq + highFreq + noise;

        // Ensure y doesn't go below a minimum or above maximum
        const clampedY = Math.max(height * 0.5, Math.min(height * 0.9, y));

        pathData += `L${x},${clampedY} `;
      }

      // Close the path to create the water shape
      pathData += `L${width},${height} L0,${height} Z`;

      return pathData;
    };

    createCoastline();

    // Recreate coastline on window resize
    const handleResize = () => createCoastline();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [widthMultiplier, height, pointSpacing, gradientStops]);

  return coastlineRef;
}
