import { useCallback } from 'react';
import { useEnhancedState } from '@/lib/core/StateManager';
import { localStorageAdapter } from '@/lib/core/StateManager';

export type BackgroundBarVariant = 'gradient' | 'solid' | 'text';
export type BackgroundBarHeight = 'sm' | 'md' | 'lg';

interface BackgroundBarConfig {
  variant: BackgroundBarVariant;
  height: BackgroundBarHeight;
  position: 'top' | 'bottom';
  showBackgroundBar: boolean;
}

interface UseBackgroundBarResult {
  config: BackgroundBarConfig;
  setVariant: (variant: BackgroundBarVariant) => void;
  setHeight: (height: BackgroundBarHeight) => void;
  setPosition: (position: 'top' | 'bottom') => void;
  toggleBackgroundBar: () => void;
  setShowBackgroundBar: (show: boolean) => void;
  resetToDefaults: () => void;
}

const BACKGROUND_BAR_STORAGE_KEY = 'background-bar-config';

const defaultConfig: BackgroundBarConfig = {
  variant: 'gradient',
  height: 'md',
  position: 'top',
  showBackgroundBar: false
};

export function useBackgroundBar(): UseBackgroundBarResult {
  const [config, setConfig] = useEnhancedState<BackgroundBarConfig>(
    defaultConfig,
    {
      key: BACKGROUND_BAR_STORAGE_KEY,
      storage: localStorageAdapter,
      persist: true,
      validate: (config: BackgroundBarConfig) => {
        return (
          ['gradient', 'solid', 'text'].includes(config.variant) &&
          ['sm', 'md', 'lg'].includes(config.height) &&
          ['top', 'bottom'].includes(config.position) &&
          typeof config.showBackgroundBar === 'boolean'
        );
      }
    }
  );

  const setVariant = useCallback((variant: BackgroundBarVariant) => {
    setConfig(prev => ({ ...prev, variant }));
  }, [setConfig]);

  const setHeight = useCallback((height: BackgroundBarHeight) => {
    setConfig(prev => ({ ...prev, height }));
  }, [setConfig]);

  const setPosition = useCallback((position: 'top' | 'bottom') => {
    setConfig(prev => ({ ...prev, position }));
  }, [setConfig]);

  const setShowBackgroundBar = useCallback((showBackgroundBar: boolean) => {
    setConfig(prev => ({ ...prev, showBackgroundBar }));
  }, [setConfig]);

  const toggleBackgroundBar = useCallback(() => {
    setConfig(prev => ({ ...prev, showBackgroundBar: !prev.showBackgroundBar }));
  }, [setConfig]);

  const resetToDefaults = useCallback(() => {
    setConfig(defaultConfig);
  }, [setConfig]);

  return {
    config,
    setVariant,
    setHeight,
    setPosition,
    toggleBackgroundBar,
    setShowBackgroundBar,
    resetToDefaults
  };
}

export default useBackgroundBar;
