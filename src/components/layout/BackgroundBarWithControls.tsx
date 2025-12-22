"use client";

import React from "react";
import { MainBackgroundBar } from "./MainBackgroundBar";
import { useBackgroundBar } from "@/hooks/layout";

interface BackgroundBarWithControlsProps {
  className?: string;
}

export function BackgroundBarWithControls({
  className,
}: BackgroundBarWithControlsProps) {
  const { config } = useBackgroundBar();

  return (
    <>
      {/* Main Background Bar - Only show when enabled */}
      {config.showBackgroundBar && (
        <MainBackgroundBar
          variant={config.variant}
          position={config.position}
          height={config.height}
          className={className}
        />
      )}
    </>
  );
}

export default BackgroundBarWithControls;
