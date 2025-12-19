import { useState, useCallback, useEffect } from 'react';

export interface CrawlSettings {
  autoDownloadEnabled: boolean;
}

interface UseCrawlSettingsResult {
  settings: CrawlSettings;
  updateSettings: (updates: Partial<CrawlSettings>) => void;
  resetSettings: () => void;
}

const STORAGE_KEY = 'crawlSettings';
const DEFAULT_SETTINGS: CrawlSettings = {
  autoDownloadEnabled: true,
};

// Load settings from localStorage
const loadSettingsFromStorage = (): CrawlSettings => {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_SETTINGS;

    const parsed = JSON.parse(saved);
    return {
      autoDownloadEnabled:
        parsed.autoDownloadEnabled !== undefined
          ? parsed.autoDownloadEnabled
          : DEFAULT_SETTINGS.autoDownloadEnabled,
    };
  } catch (error) {
    console.error("Failed to load settings from localStorage:", error);
    return DEFAULT_SETTINGS;
  }
};

// Save settings to localStorage
const saveSettingsToStorage = (settings: CrawlSettings): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save settings to localStorage:", error);
  }
};

export const useCrawlSettings = (): UseCrawlSettingsResult => {
  const [settings, setSettings] = useState<CrawlSettings>(loadSettingsFromStorage);

  // Save settings whenever they change
  useEffect(() => {
    saveSettingsToStorage(settings);
  }, [settings]);

  const updateSettings = useCallback((updates: Partial<CrawlSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return {
    settings,
    updateSettings,
    resetSettings,
  };
};
