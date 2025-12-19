"use client";

import dynamic from 'next/dynamic';

// Dynamically import the background bar with controls to avoid SSR issues
const BackgroundBarWithControls = dynamic(
  () => import('./BackgroundBarWithControls').then(mod => ({ default: mod.BackgroundBarWithControls })),
  { ssr: false }
);

interface BackgroundBarWrapperProps {
  className?: string;
}

export function BackgroundBarWrapper({ className }: BackgroundBarWrapperProps) {
  return <BackgroundBarWithControls />;
}

export default BackgroundBarWrapper;
