// Configuration management system
import { useState, useCallback } from "react";

interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  features: {
    crawlEnabled: boolean;
    fileUploadEnabled: boolean;
    chatEnabled: boolean;
    activityTracking: boolean;
  };
  performance: {
    enableVirtualization: boolean;
    enableLazyLoading: boolean;
    enableDebouncing: boolean;
    enableThrottling: boolean;
  };
  security: {
    enableCSRFProtection: boolean;
    enableRateLimiting: boolean;
    enableFileValidation: boolean;
    enableContentSecurityPolicy: boolean;
  };
  ui: {
    theme: "light" | "dark" | "auto";
    language: string;
    pageSize: number;
    enableAnimations: boolean;
  };
}

// Default configuration
const defaultConfig: AppConfig = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "",
    timeout: 30000,
    retries: 3,
  },
  features: {
    crawlEnabled: process.env.NEXT_PUBLIC_CRAWL_ENABLED !== "false",
    fileUploadEnabled: process.env.NEXT_PUBLIC_FILE_UPLOAD_ENABLED !== "false",
    chatEnabled: process.env.NEXT_PUBLIC_CHAT_ENABLED !== "false",
    activityTracking:
      process.env.NEXT_PUBLIC_ACTIVITY_TRACKING_ENABLED !== "false",
  },
  performance: {
    enableVirtualization: true,
    enableLazyLoading: true,
    enableDebouncing: true,
    enableThrottling: true,
  },
  security: {
    enableCSRFProtection: process.env.NODE_ENV === "production",
    enableRateLimiting: process.env.NODE_ENV === "production",
    enableFileValidation: true,
    enableContentSecurityPolicy: process.env.NODE_ENV === "production",
  },
  ui: {
    theme: "auto",
    language: "en",
    pageSize: 20,
    enableAnimations: true,
  },
};

// Configuration manager class
export class ConfigManager {
  private static instance: ConfigManager;
  private config: AppConfig;
  private listeners: Set<(config: AppConfig) => void> = new Set();

  private constructor() {
    this.config = { ...defaultConfig };
    this.loadFromStorage();
    this.loadFromEnvironment();
  }

  // Singleton instance
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  // Get configuration value
  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }

  // Get all configuration
  getAll(): AppConfig {
    return { ...this.config };
  }

  // Set configuration value
  set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    this.config[key] = value;
    this.saveToStorage();
    this.notifyListeners();
  }

  // Update multiple configuration values
  update(updates: Partial<AppConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveToStorage();
    this.notifyListeners();
  }

  // Reset to default configuration
  reset(): void {
    this.config = { ...defaultConfig };
    this.saveToStorage();
    this.notifyListeners();
  }

  // Subscribe to configuration changes
  subscribe(callback: (config: AppConfig) => void): () => void {
    this.listeners.add(callback);
    callback(this.config);

    return () => {
      this.listeners.delete(callback);
    };
  }

  // Load configuration from localStorage
  private loadFromStorage(): void {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem("app-config");
      if (stored) {
        const parsedConfig = JSON.parse(stored);
        // Merge with defaults to handle new properties
        this.config = this.mergeConfig(defaultConfig, parsedConfig);
      }
    } catch {
      console.warn("Failed to load configuration from storage");
    }
  }

  // Load configuration from environment variables
  private loadFromEnvironment(): void {
    // Override with environment variables
    const envConfig: Partial<AppConfig> = {
      api: {
        baseUrl:
          process.env.NEXT_PUBLIC_API_BASE_URL || defaultConfig.api.baseUrl,
        timeout: process.env.NEXT_PUBLIC_API_TIMEOUT
          ? parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT)
          : defaultConfig.api.timeout,
        retries: process.env.NEXT_PUBLIC_API_RETRIES
          ? parseInt(process.env.NEXT_PUBLIC_API_RETRIES)
          : defaultConfig.api.retries,
      },
      features: {
        crawlEnabled: process.env.NEXT_PUBLIC_CRAWL_ENABLED !== "false",
        fileUploadEnabled:
          process.env.NEXT_PUBLIC_FILE_UPLOAD_ENABLED !== "false",
        chatEnabled: process.env.NEXT_PUBLIC_CHAT_ENABLED !== "false",
        activityTracking:
          process.env.NEXT_PUBLIC_ACTIVITY_TRACKING_ENABLED !== "false",
      },
      performance: {
        enableVirtualization:
          process.env.NEXT_PUBLIC_ENABLE_VIRTUALIZATION !== "false",
        enableLazyLoading:
          process.env.NEXT_PUBLIC_ENABLE_LAZY_LOADING !== "false",
        enableDebouncing: process.env.NEXT_PUBLIC_ENABLE_DEBOUNCING !== "false",
        enableThrottling: process.env.NEXT_PUBLIC_ENABLE_THROTTLING !== "false",
      },
      security: {
        enableCSRFProtection:
          process.env.NEXT_PUBLIC_ENABLE_CSRF_PROTECTION === "true",
        enableRateLimiting:
          process.env.NEXT_PUBLIC_ENABLE_RATE_LIMITING === "true",
        enableFileValidation:
          process.env.NEXT_PUBLIC_ENABLE_FILE_VALIDATION !== "false",
        enableContentSecurityPolicy:
          process.env.NEXT_PUBLIC_ENABLE_CSP === "true",
      },
      ui: {
        theme:
          (process.env.NEXT_PUBLIC_THEME as "light" | "dark" | "auto") ||
          defaultConfig.ui.theme,
        language: process.env.NEXT_PUBLIC_LANGUAGE || defaultConfig.ui.language,
        pageSize: process.env.NEXT_PUBLIC_PAGE_SIZE
          ? parseInt(process.env.NEXT_PUBLIC_PAGE_SIZE)
          : defaultConfig.ui.pageSize,
        enableAnimations: process.env.NEXT_PUBLIC_ENABLE_ANIMATIONS !== "false",
      },
    };

    this.config = this.mergeConfig(this.config, envConfig);
  }

  // Save configuration to localStorage
  private saveToStorage(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem("app-config", JSON.stringify(this.config));
    } catch {
      console.warn("Failed to save configuration to storage");
    }
  }

  // Deep merge configuration objects
  private mergeConfig(
    base: AppConfig,
    override: Partial<AppConfig>,
  ): AppConfig {
    const result = { ...base };

    for (const key in override) {
      const k = key as keyof AppConfig;
      const value = override[k];
      if (
        value !== undefined &&
        typeof value === "object" &&
        !Array.isArray(value)
      ) {
        (result[k] as Record<string, unknown>) = {
          ...(base[k] as Record<string, unknown>),
          ...value,
        };
      } else if (value !== undefined) {
        (result as Record<keyof AppConfig, unknown>)[k] = value;
      }
    }

    return result;
  }

  // Notify all listeners
  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback(this.config));
  }

  // Validate configuration
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate API configuration
    if (this.config.api.timeout <= 0) {
      errors.push("API timeout must be positive");
    }

    if (this.config.api.retries < 0) {
      errors.push("API retries must be non-negative");
    }

    // Validate UI configuration
    if (this.config.ui.pageSize <= 0) {
      errors.push("Page size must be positive");
    }

    if (!["light", "dark", "auto"].includes(this.config.ui.theme)) {
      errors.push("Theme must be light, dark, or auto");
    }

    // Validate feature flags
    if (typeof this.config.features.crawlEnabled !== "boolean") {
      errors.push("Crawl enabled must be boolean");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Export configuration for debugging
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  // Import configuration
  importConfig(configJson: string): { success: boolean; error?: string } {
    try {
      const imported = JSON.parse(configJson);
      const validation = this.validate();

      if (validation.valid) {
        this.config = this.mergeConfig(defaultConfig, imported);
        this.saveToStorage();
        this.notifyListeners();
        return { success: true };
      } else {
        return {
          success: false,
          error: `Invalid configuration: ${validation.errors.join(", ")}`,
        };
      }
    } catch {
      return {
        success: false,
        error: "Invalid JSON format",
      };
    }
  }
}

// Configuration utilities
export const configUtils = {
  // Get environment-specific configuration
  getEnvironmentConfig(): "development" | "staging" | "production" {
    if (process.env.NODE_ENV === "production") return "production";
    if (process.env.NODE_ENV === "test") return "staging";
    return "development";
  },

  // Check if feature is enabled
  isFeatureEnabled(feature: keyof AppConfig["features"]): boolean {
    const config = ConfigManager.getInstance();
    return config.get("features")[feature];
  },

  // Get API URL
  getApiUrl(endpoint: string): string {
    const config = ConfigManager.getInstance();
    const baseUrl = config.get("api").baseUrl;
    return baseUrl ? `${baseUrl}${endpoint}` : endpoint;
  },

  // Get pagination size
  getPageSize(): number {
    const config = ConfigManager.getInstance();
    return config.get("ui").pageSize;
  },

  // Check if security is enabled
  isSecurityEnabled(feature: keyof AppConfig["security"]): boolean {
    const config = ConfigManager.getInstance();
    return config.get("security")[feature];
  },

  // Check if performance optimization is enabled
  isPerformanceEnabled(feature: keyof AppConfig["performance"]): boolean {
    const config = ConfigManager.getInstance();
    return config.get("performance")[feature];
  },
};

// Configuration hooks for React
export function useConfig<K extends keyof AppConfig>(
  key: K,
): [AppConfig[K], (value: AppConfig[K]) => void] {
  const [value, setValue] = useState(() => {
    return ConfigManager.getInstance().get(key);
  });

  const updateValue = useCallback(
    (newValue: AppConfig[K]) => {
      ConfigManager.getInstance().set(key, newValue);
      setValue(newValue);
    },
    [key],
  );

  return [value, updateValue];
}

interface UseConfigAllResult {
  config: AppConfig;
  updateConfig: (updates: Partial<AppConfig>) => void;
  resetConfig: () => void;
}

export function useConfigAll(): UseConfigAllResult {
  const [config, setConfig] = useState(() => {
    return ConfigManager.getInstance().getAll();
  });

  const updateConfig = useCallback((updates: Partial<AppConfig>) => {
    ConfigManager.getInstance().update(updates);
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetConfig = useCallback(() => {
    ConfigManager.getInstance().reset();
    setConfig(ConfigManager.getInstance().getAll());
  }, []);

  return {
    config,
    updateConfig,
    resetConfig,
  };
}

export type { AppConfig };
export { defaultConfig };
